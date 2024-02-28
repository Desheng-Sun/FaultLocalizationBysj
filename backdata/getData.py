# api/app.py
import json
import math
import subprocess
from flask_cors import *
import os
import re
from flask import Flask, jsonify, request, make_response, send_from_directory, send_file
from pygdbmi.gdbcontroller import GdbController
import shutil
from pathlib import Path
import difflib

app = Flask(__name__)
CORS(app, supports_credentials=True, resources=r'/*')

# # 保存所有软件测试用例

nowPath = os.getcwd().replace("\\", "/") + "/data/print_tokens1"
# 获取所有的测试用例----------------------------------------------------------------------------
@app.route("/getAllTestCase", methods=["GET"])
def getAllTestCase():
    file = open(nowPath + "/runTime.json", "r", encoding="utf-8")
    data = json.load(file)
    return data