# Copyright (c) 2012-2016 Seafile Ltd.

import logging
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from seahub.utils import HAS_OFFLINE_DOWNLOAD, get_all_offline_download_tasks
from seaserv import seafile_api

from seahub.api2.authentication import TokenAuthentication
from seahub.api2.throttling import UserRateThrottle
from seahub.api2.utils import api_error

logger = logging.getLogger(__name__)


class AdminOfflineDownloadTasks(APIView):

    authentication_classes = (TokenAuthentication, SessionAuthentication)
    permission_classes = (IsAdminUser,)
    throttle_classes = (UserRateThrottle,)

    def get(self, request, format=None):
        """  Get all tasks.
        """

        if not HAS_OFFLINE_DOWNLOAD:
            error_msg = 'Offline download not supported.'
            return api_error(status.HTTP_403_FORBIDDEN, error_msg)

        # argument check
        try:
            page = int(request.GET.get('page', ''))
        except ValueError:
            page = 1

        try:
            per_page = int(request.GET.get('per_page', ''))
        except ValueError:
            per_page = 25

        start = (page - 1) * per_page
        count = per_page + 1

        if start < 0 or count < 0:
            error_msg = 'page or per_page invalid.'
            return api_error(status.HTTP_400_BAD_REQUEST, error_msg)

        try:
            tasks = get_all_offline_download_tasks(start, count)
        except Exception as e:
            logger.error(e)
            error_msg = 'Internal Server Error'
            return api_error(status.HTTP_500_INTERNAL_SERVER_ERROR, error_msg)

        if len(tasks) > per_page:
            tasks = tasks[:per_page]
            has_next_page = True
        else:
            has_next_page = False

        result = []
        for task in tasks:
            try:
                repo = seafile_api.get_repo(task.repo_id)
                repo_owner = seafile_api.get_repo_owner(task.repo_id)
            except Exception as e:
                logger.error(e)
                continue

            if not repo:
                continue
            else:
                record = dict()
                record["repo_name"] = repo.name
                record["repo_owner"] = repo_owner
                record["task_owner"] = task.owner
                record["file_path"] = task.path
                record['url'] = task.url
                record['size'] = task.size
                record['status'] = task.status
                # record['comment'] = task.comment
                result.append(record)

        return Response({'task_list': result, 'has_next_page': has_next_page}, status=status.HTTP_200_OK)
