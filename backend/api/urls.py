from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ProductViewSet, CategoryViewSet, ProviderViewSet, ClientViewSet, 
    SaleViewSet, ReportsView, UserViewSet, GroupViewSet, DailyCashCountView,
    BulkPriceUpdateView, MyTokenObtainPairView, 
    PaymentMethodViewSet, AdminPaymentMethodViewSet, DashboardReportsView,
    ExportSalesView, cancel_sale_view
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'providers', ProviderViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'payment-methods', PaymentMethodViewSet) 
router.register(r'admin/payment-methods', AdminPaymentMethodViewSet, basename='admin-payment-methods')

urlpatterns = [
    path('reports/export-sales/', ExportSalesView.as_view(), name='export-sales'),
    path('sales/<int:pk>/cancel/', cancel_sale_view, name='cancel-sale'),
    path('reports/dashboard/', DashboardReportsView.as_view(), name='dashboard-reports'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('reports/', ReportsView.as_view(), name='reports'),
    path('cash-count/', DailyCashCountView.as_view(), name='cash_count'),
    path('bulk-price-update/', BulkPriceUpdateView.as_view(), name='bulk_price_update'),
    path('', include(router.urls)),
]
