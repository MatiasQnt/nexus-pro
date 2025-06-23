# En api/management/commands/populate_db.py

import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

# --- INICIO DEL CAMBIO ---
# Se cambia el import relativo por uno absoluto desde la raíz del proyecto
from api.models import (
    PaymentMethod, Provider, Category, Product, Client, Sale, SaleDetail, User
)
# --- FIN DEL CAMBIO ---

class Command(BaseCommand):
    help = 'Populate the database with realistic fake data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Limpiando la base de datos...")
        # Borra en orden para evitar problemas de claves foráneas
        SaleDetail.objects.all().delete()
        Sale.objects.all().delete()
        Client.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Provider.objects.all().delete()
        PaymentMethod.objects.all().delete()
        # No borramos los usuarios para no eliminar al superusuario

        self.stdout.write("Creando datos de prueba...")
        faker = Faker('es_AR')

        # --- Creando Usuarios Vendedores ---
        vendedores = []
        for i in range(3):
            username = f'vendedor{i+1}'
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(username=username, password='password123')
                vendedores.append(user)
            else:
                vendedores.append(User.objects.get(username=username))

        # --- Creando Métodos de Pago ---
        metodos_pago_data = [
            {'name': 'Efectivo', 'adjustment_percentage': -10.00},
            {'name': 'Tarjeta de Débito', 'adjustment_percentage': 0.00},
            {'name': 'Tarjeta de Crédito', 'adjustment_percentage': 5.50},
            {'name': 'Mercado Pago', 'adjustment_percentage': 7.00},
        ]
        metodos_pago = [PaymentMethod.objects.create(**data) for data in metodos_pago_data]

        # --- Creando Proveedores ---
        proveedores = [Provider.objects.create(
            name=faker.company(),
            contact_person=faker.name(),
            phone_number=faker.phone_number()
        ) for _ in range(10)]

        # --- Creando Categorías ---
        categorias_data = ['Electrónica', 'Alimentos', 'Bebidas', 'Limpieza', 'Librería', 'Juguetería', 'Ropa']
        categorias = [Category.objects.create(name=name, description=faker.sentence(nb_words=6)) for name in categorias_data]

        # --- Creando Clientes ---
        clientes = [Client.objects.create(
            name=faker.name(),
            email=faker.unique.email(),
            phone_number=faker.phone_number(),
            birthday=faker.date_of_birth(minimum_age=18, maximum_age=90)
        ) for _ in range(30)]

        # --- Creando Productos ---
        productos = []
        for _ in range(150):
            costo = round(random.uniform(100.0, 50000.0), 2)
            venta = round(costo * random.uniform(1.3, 2.5), 2)
            producto = Product.objects.create(
                sku=faker.unique.ean(length=8),
                name=faker.bs().title(),
                description=faker.text(max_nb_chars=150),
                cost_price=costo,
                sale_price=venta,
                stock=random.randint(5, 100),
                category=random.choice(categorias),
                provider=random.choice(proveedores),
            )
            productos.append(producto)

        self.stdout.write("Generando historial de ventas de los últimos 60 días...")
        
        # --- Creando Ventas y sus Detalles ---
        today = timezone.now()
        for i in range(250): # Generar 250 ventas
            sale_datetime = faker.date_time_between(start_date=today - timedelta(days=60), end_date=today, tzinfo=timezone.get_current_timezone())
            
            sale = Sale.objects.create(
                user=random.choice(vendedores),
                client=random.choice(clientes) if random.random() < 0.7 else None,
                payment_method=random.choice(metodos_pago),
                total_amount=0
            )
            
            subtotal = 0
            num_detalles = random.randint(1, 5)

            productos_en_venta = random.sample(productos, num_detalles)

            for producto_en_venta in productos_en_venta:
                if producto_en_venta.stock > 0:
                    cantidad = random.randint(1, 3)
                    if cantidad > producto_en_venta.stock:
                        cantidad = producto_en_venta.stock
                    
                    precio_unitario = producto_en_venta.sale_price
                    SaleDetail.objects.create(
                        sale=sale,
                        product=producto_en_venta,
                        quantity=cantidad,
                        unit_price=precio_unitario
                    )
                    subtotal += precio_unitario * cantidad
                    
                    producto_en_venta.stock -= cantidad
                    producto_en_venta.save()

            sale.total_amount = subtotal
            sale.save()
            
            Sale.objects.filter(pk=sale.pk).update(date_time=sale_datetime)

        self.stdout.write(self.style.SUCCESS('¡Base de datos poblada con éxito!'))