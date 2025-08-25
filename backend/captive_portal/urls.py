from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/billing/', include('billing.urls')),
    path('api/v1/access/', include('access.urls')),
    path('api/v1/portal/', include('portal.urls')),
    path('api/v1/audit/', include('audit.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
]