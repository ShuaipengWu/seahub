import django.dispatch

send_moss_result_to_user = django.dispatch.Signal(providing_args=["to_user", "moss_url"])
