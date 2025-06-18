from django.contrib import admin
from .models import Provider, Category, Product, Client, Sale, SaleDetail, PaymentMethod, CashCount

admin.site.register(Provider)
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Client)
admin.site.register(Sale)
admin.site.register(SaleDetail)
admin.site.register(PaymentMethod)
admin.site.register(CashCount)