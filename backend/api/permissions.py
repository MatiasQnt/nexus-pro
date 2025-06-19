from rest_framework import permissions

def _is_in_group(user, group_name):
    """
    Verifica si un usuario pertenece a un grupo específico.
    """
    if user.is_authenticated:
        return user.groups.filter(name=group_name).exists()
    return False

# --- NUEVOS NOMBRES DE CLASES Y GRUPOS ---

class IsSuperAdminUser(permissions.BasePermission):
    """ Permiso para el rol SuperAdmin. """
    def has_permission(self, request, view):
        return _is_in_group(request.user, 'SuperAdmin')

class IsAdminUser(permissions.BasePermission):
    """ Permiso para el rol Admin. """
    def has_permission(self, request, view):
        return _is_in_group(request.user, 'Admin')

class IsVendedorUser(permissions.BasePermission):
    """ Permiso para el rol Vendedor. """
    def has_permission(self, request, view):
        return _is_in_group(request.user, 'Vendedor')

class IsSuperAdminOrAdmin(permissions.BasePermission):
    """ Permiso para SuperAdmin o Admin. """
    def has_permission(self, request, view):
        return _is_in_group(request.user, 'SuperAdmin') or _is_in_group(request.user, 'Admin')

class CanViewPanel(permissions.BasePermission):
    """ Permiso para ver el panel (Todos los roles). """
    def has_permission(self, request, view):
        return _is_in_group(request.user, 'SuperAdmin') or \
               _is_in_group(request.user, 'Admin') or \
               _is_in_group(request.user, 'Vendedor')

class CanCreateSales(permissions.BasePermission):
    """ Permiso para crear ventas (Todos los roles). """
    def has_permission(self, request, view):
        return _is_in_group(request.user, 'SuperAdmin') or \
               _is_in_group(request.user, 'Admin') or \
               _is_in_group(request.user, 'Vendedor')