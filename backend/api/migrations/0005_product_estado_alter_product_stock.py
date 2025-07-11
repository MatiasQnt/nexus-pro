# Generated by Django 5.2.2 on 2025-06-20 18:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_sale_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='estado',
            field=models.CharField(choices=[('activo', 'Activo'), ('inactivo', 'Inactivo')], default='activo', max_length=10, verbose_name='Estado'),
        ),
        migrations.AlterField(
            model_name='product',
            name='stock',
            field=models.PositiveIntegerField(default=1, verbose_name='Stock Actual'),
        ),
    ]
