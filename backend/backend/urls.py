from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Esta única línea se encarga de delegar todas las rutas que empiezan
    # con /api/ a nuestro archivo api/urls.py.
    path('api/', include('api.urls')),
]
