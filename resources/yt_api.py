# pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

import os
import pandas as pd
import json

from venv import create
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google.auth.exceptions import RefreshError
from google.oauth2 import id_token
from google.auth import jwt

from tabulate import tabulate

SCOPES = ['https://www.googleapis.com/auth/yt-analytics.readonly']
API_SERVICE_NAME = 'youtubeAnalytics'
API_VERSION = 'v2'
CLIENT_SECRETS_FILE = './resources/client.json'

def get_credentials():
    creds = None
    token_file = './resources/token.json'

    # Kiểm tra xem đã có thông tin xác thực trong file token.json chưa
    if os.path.exists(token_file) and os.path.getsize(token_file) > 0:
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)

    print("creds:", creds)

    # Nếu chưa có thông tin xác thực hoặc thông tin xác thực hết hạn
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            # Refresh token
            try:
                creds.refresh(Request())
            except RefreshError:
                pass
        else:
            # Yêu cầu người dùng xác thực
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
            creds = flow.run_local_server(port=9900)
        
        # Lưu thông tin xác thực vào file token.json
        with open(token_file, 'w') as token:
            token.write(creds.to_json())

        print("valid:", creds.valid)

    return creds


def get_service():
    credentials = get_credentials()
    return build(API_SERVICE_NAME, API_VERSION, credentials=credentials)


def execute_api_request(client_library_function, **kwargs):
    response = client_library_function(
        **kwargs
    ).execute()
    return response


def create_table(table, headers=None):
    if headers:
        headerstring = "\t{}\t" * len(headers)
        print(headerstring.format(*headers))

    rowstring = "\t{}\t" * len(table[0])

    for row in table:
        print(rowstring.format(*row))


if __name__ == '__main__':
    youtubeAnalytics = get_service()
    with open('./resources/date_request.json') as f:
        data = json.load(f)

    result = execute_api_request(
        youtubeAnalytics.reports().query,
        ids='channel==MINE',
        startDate=data["startDate"],
        endDate=data["endDate"],
        metrics='subscribersGained,views,likes,estimatedMinutesWatched,averageViewDuration',
        dimensions='day',
        sort='day'
    )

    with open('./resources/result.json', 'w') as f:
        json.dump(result, f)