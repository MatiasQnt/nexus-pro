from django.db import models
from django.contrib.auth.models import User

class PaymentMethod(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Nombre del Método')
    adjustment_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name='Ajuste porcentual (%)',
        help_text='Ej: -10.00 para 10% de descuento, 8.50 para 8.5% de recargo.'
    )
    is_active = models.BooleanField(default=True, verbose_name='Activo')

    def __str__(self):
        return f"{self.name} ({self.adjustment_percentage}%)"

class Provider(models.Model):
    name = models.CharField(max_length=100, verbose_name='Nombre')
    contact_person = models.CharField(max_length=100, blank=True, null=True, verbose_name='Persona de Contacto')
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    def __str__(self): return self.name

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    is_active = models.BooleanField(default=True, verbose_name='Activa')
    def __str__(self): return self.name

class Product(models.Model):
    STATUS_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    sku = models.CharField(max_length=50, unique=True, verbose_name='SKU / Código')
    name = models.CharField(max_length=200, verbose_name='Nombre')
    description = models.TextField(blank=True, null=True, verbose_name='Descripción')
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio de Costo')
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio de Venta')
    stock = models.PositiveIntegerField(default=1, verbose_name='Stock Actual')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, verbose_name='Categoría')
    provider = models.ForeignKey(Provider, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Proveedor')
    estado = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='activo', 
        verbose_name='Estado'
    )
    def __str__(self): return self.name

class Client(models.Model):
    name = models.CharField(max_length=200, verbose_name='Nombre')
    email = models.EmailField(unique=True, blank=True, null=True, verbose_name='Email')
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono')
    birthday = models.DateField(blank=True, null=True, verbose_name='Fecha de Nacimiento')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    def __str__(self): return self.name

class Sale(models.Model):
    STATUS_CHOICES = [
        ('Completada', 'Completada'),
        ('Cancelada', 'Cancelada'),
    ]

    date_time = models.DateTimeField(auto_now_add=True, verbose_name='Fecha y Hora')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='Vendedor')
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Cliente')
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Subtotal (sin ajuste)')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT, null=True, blank=True, verbose_name='Método de Pago')
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, verbose_name='Monto Final (con ajuste)')
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='Completada', 
        verbose_name='Estado'
    )
    
    def save(self, *args, **kwargs):
        if self.payment_method:
            adjustment = 1 + (self.payment_method.adjustment_percentage / 100)
            self.final_amount = self.total_amount * adjustment
        else:
            self.final_amount = self.total_amount
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Venta #{self.id} - {self.date_time.strftime('%d/%m/%Y %H:%M')}"

class SaleDetail(models.Model):
    sale = models.ForeignKey(Sale, related_name='details', on_delete=models.CASCADE, verbose_name='Venta')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, verbose_name='Producto')
    quantity = models.PositiveIntegerField(verbose_name='Cantidad')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio Unitario')
    def __str__(self): return f"{self.quantity} x {self.product.name} en Venta #{self.sale.id}"

class CashCount(models.Model):
    date = models.DateField(unique=True, verbose_name='Fecha')
    expected_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Monto Esperado')
    counted_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Monto Contado')
    difference = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Diferencia')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='Usuario')
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"Cierre de caja del {self.date}"