# Copyright (c) 2012-2016 Seafile Ltd.

from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from seahub.utils import HAS_OFFLINE_DOWNLOAD

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error

from seahub.views import check_folder_permission

from seahub.utils import get_offline_download_tasks, add_offline_download_task


class OfflineDownloadTasks(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def put(self, request, format=None):
        """  Add a new task for user.
        """

        if not HAS_OFFLINE_DOWNLOAD:
            error_msg = 'Offline download not supported.'
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        repo_id = request.data.get('repo_id', None)
        if not repo_id:
            error_msg = 'repo_id invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        path = request.data.get('path', None)
        if not path:
            error_msg = 'path invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        url = request.data.get('url', None)
        if not url:
            error_msg = 'url invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        username = request.user.username

        # permission check
        if not check_folder_permission(request, repo_id, '/'):
            error_msg = 'Permission denied.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        add_offline_download_task(username, repo_id, path, url)

        return Response({'success': True})

    def get(self, request, format=None):
        """  Get user's task list.
        """

        if not HAS_OFFLINE_DOWNLOAD:
            error_msg = 'Offline download not supported.'
            return api_error(status.HTTP_404_NOT_FOUND, error_msg)

        # argument check
        username = request.user.username

        try:
            current_page = int(request.GET.get('page', '1'))
            per_page = int(request.GET.get('per_page', '10'))
            if per_page > 100:
                per_page = 100
        except ValueError:
            current_page = 1
            per_page = 10

        start = (current_page - 1) * per_page
        size = per_page
        if start < 0 or size < 0:
            error_msg = 'page or per_page invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        tasks = get_offline_download_tasks(username, start, size)

        result = []
        for task in tasks:
            # {'repo_id': 'XXXXXXXX', 'path': /123/456, 'url': www.baidu.com, 'status': 1, 'comment': ''}
            task_info = {}
            # task_info['repo_id'] = {}
            # task_info['path'] = task.path
            task_info['url'] = task.url
            task_info['status'] = task.status
            # task_info['comment'] = task.comment
            result.append(task_info)

        return Response({'data': result})

