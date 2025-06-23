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
        fields = ['id', 'name', 'contact_person', 'phone_number', 'email', 'is_active']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description','is_active']

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'name', 'email', 'phone_number', 'birthday', 'is_active']

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name"]

class CashCountSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    class Meta:
        model = CashCount
        fields = '__all__'

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    provider_name = serializers.CharField(source='provider.name', read_only=True, allow_null=True)
    
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.filter(is_active=True), allow_null=True)
    
    provider = serializers.PrimaryKeyRelatedField(queryset=Provider.objects.filter(is_active=True), allow_null=True, required=False)
    
    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'description', 'cost_price', 'sale_price', 'stock', 'category', 'provider', 'category_name', 'provider_name', 'estado']

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
    groups = serializers.PrimaryKeyRelatedField(many=True, queryset=Group.objects.all())
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'groups', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'email': {'required': False, 'allow_blank': True}
        }

    def create(self, validated_data):
        # La lógica de creación necesita la contraseña.
        if 'password' not in validated_data:
            raise serializers.ValidationError({"password": "Este campo es requerido al crear un usuario."})
        
        groups = validated_data.pop('groups')
        user = User.objects.create_user(**validated_data) # Usamos create_user para hashear la contraseña
        user.groups.set(groups)
        return user

    def update(self, instance, validated_data):
        # En la actualización, la contraseña es opcional.
        groups = validated_data.pop('groups', None)
        
        # Actualizamos los campos normales
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        
        # Si se proporcionó una nueva contraseña, la actualizamos.
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])
        
        instance.save()

        # Si se proporcionaron grupos, los actualizamos.
        if groups is not None:
            instance.groups.set(groups)
            
        return instance

class SaleDetailReadSerializer(serializers.ModelSerializer):
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