from django.apps import AppConfig


class ListConfig(AppConfig):
    name = 'boards'

    def ready(self):
        import boards.signals
