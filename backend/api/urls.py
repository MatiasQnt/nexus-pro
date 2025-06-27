from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ProductViewSet, CategoryViewSet, ProviderViewSet, ClientViewSet,
    SaleViewSet, ReportsView, UserViewSet, GroupViewSet, DailyCashCountView,
    BulkPriceUpdateView, MyTokenObtainPairView, PaymentMethodViewSet, 
    AdminPaymentMethodViewSet, DashboardReportsView,
    ExportSalesView, cancel_sale_view, ChangePasswordView, get_dolar_cotizaciones,
    CashCountHistoryViewSet,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'providers', ProviderViewSet, basename='provider')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'users', UserViewSet, basename='user')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'cash-count-history', CashCountHistoryViewSet, basename='cashcounthistory')
router.register(r'payment-methods', PaymentMethodViewSet, basename='paymentmethod')
router.register(r'admin/payment-methods', AdminPaymentMethodViewSet, basename='admin-payment-methods')

urlpatterns = [
    # Nueva ruta para que un usuario cambie su propia contraseña.
    path('users/change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Rutas existentes
    path('reports/export-sales/', ExportSalesView.as_view(), name='export-sales'),
    path('sales/<int:pk>/cancel/', cancel_sale_view, name='cancel-sale'),
    path('reports/dashboard/', DashboardReportsView.as_view(), name='dashboard-reports'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('reports/', ReportsView.as_view(), name='reports'),
    path('cash-count/', DailyCashCountView.as_view(), name='cash_count'),
    path('bulk-price-update/', BulkPriceUpdateView.as_view(), name='bulk_price_update'),
    path('cotizaciones/', get_dolar_cotizaciones, name='get_dolar_cotizaciones'),
    
    # Esta línea incluye todas las URLs generadas por el router (como /products/, /users/, etc.)
    path('', include(router.urls)),
]
