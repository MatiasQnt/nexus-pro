from rest_framework import serializers
from django.contrib.auth.models import User, Group
from .models import (
    Product, Category, Provider, Client, Sale, SaleDetail, PaymentMethod,
    CashCount,
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['groups'] = list(user.groups.values_list('name', flat=True))
        return token

class ProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Provider
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        # CORRECCIÓN: Aseguramos que los campos estén explícitos y correctos
        fields = ['id', 'name', 'is_active']

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["name"]

class CashCountSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    class Meta:
        model = CashCount
        fields = '__all__'

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = '__all__'

# --- INICIO DE LA CORRECCIÓN PRINCIPAL ---
class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    provider_name = serializers.CharField(source='provider.name', read_only=True, allow_null=True)
    
    # Este es el cambio que hicimos para que solo se puedan seleccionar categorías activas
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.filter(is_active=True), allow_null=True)
    
    provider = serializers.PrimaryKeyRelatedField(queryset=Provider.objects.all(), allow_null=True, required=False)
    
    # Este es el bloque Meta que se había perdido
    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'description', 'cost_price', 'sale_price', 'stock', 'category', 'provider', 'category_name', 'provider_name', 'estado']
# --- FIN DE LA CORRECCIÓN PRINCIPAL ---

class SaleDetailWriteSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField()
    class Meta:
        model = SaleDetail
        fields = ['product_id', 'quantity', 'unit_price']

class SaleWriteSerializer(serializers.ModelSerializer):
    details = SaleDetailWriteSerializer(many=True)
    payment_method_id = serializers.IntegerField(write_only=True)
    class Meta:
        model = Sale
        fields = ['total_amount', 'details', 'user', 'client', 'payment_method_id']

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(many=True, queryset=Group.objects.all(), slug_field='name')
    class Meta:
        model = User
        fields = ['id', 'username', 'groups', 'password']
        extra_kwargs = {'password': {'write_only': True}}
        
    def create(self, validated_data):
        groups = validated_data.pop('groups')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.groups.set(groups)
        user.save()
        return user

class SaleDetailReadSerializer(serializers.ModelSerializer):
    # Esta es una de las razones por las que fallaba todo: SaleDetailReadSerializer usa ProductSerializer
    product = ProductSerializer(read_only=True) 
    
    class Meta:
        model = SaleDetail
        fields = ['product', 'quantity', 'unit_price']

class SaleReadSerializer(serializers.ModelSerializer):
    details = SaleDetailReadSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField()
    client = serializers.StringRelatedField()
    payment_method = serializers.StringRelatedField()
    
    class Meta:
        model = Sale
        fields = ['id', 'date_time', 'total_amount', 'payment_method', 'final_amount', 'user', 'client', 'details', 'status']