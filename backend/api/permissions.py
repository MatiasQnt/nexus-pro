from rest_framework import permissions

def _is_in_group(user, group_name):
    """
    Verifica si un usuario pertenece a un grupo específico.
    """
    return user.groups.filter(name=group_name).exists()

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return _is_in_group(request.user, 'Administradores')

class IsVendedorUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return _is_in_group(request.user, 'Vendedores')

class IsAdminOrVendedor(permissions.BasePermission):
    def has_permission(self, request, view):
        return _is_in_group(request.user, 'Administradores') or _is_in_group(request.user, 'Vendedores')


