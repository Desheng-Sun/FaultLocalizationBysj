# api/app.py
import json
import math
import subprocess
from alive_progress import alive_bar
from bs4 import BeautifulSoup
from flask_cors import *
import os
import re
from flask import Flask, jsonify, request, make_response, send_from_directory, send_file
from pygdbmi.gdbcontroller import GdbController
import shutil
from pathlib import Path
import difflib
from threading import Thread

app = Flask(__name__)
CORS(app, supports_credentials=True, resources=r"/*")

# # 保存所有软件测试用例

nowPath = os.getcwd().replace("\\", "/") + "/data/print_tokens-1/"


# 获取当前使用的版本----------------------------------------------------------------------------
@app.route("/getUseVersion", methods=["GET"])
def getUseVersion():
    file = open(nowPath + "useVersion.json", "r", encoding="utf-8")
    data = json.load(file)
    return data


@app.route("/changeUseVersion", methods=["POST"])
def changeUseVersion():
    nowVersion = request.json.get("nowVersion")  # 获取所有参数
    nowCodeVersion = str(request.json.get("nowCodeVersion"))  # 获取所有参数
    file = open(nowPath + "useVersion.json", "w", encoding="utf-8")
    file.write(json.dumps({"nowVersion": nowVersion, "nowCodeVersion": nowCodeVersion}))
    return []


# 获取所有的测试用例----------------------------------------------------------------------------
@app.route("/getAllTestCase", methods=["GET"])
def getAllTestCase():
    file = open(nowPath + "runTime.json", "r", encoding="utf-8")
    data = json.load(file)
    return data


# 获取项目源代码目录结构-----------------------------------------------------------------------
@app.route("/getFileItem", methods=["POST"])
def getFileItem():
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    file = open(nowPath + nowVersion + "/fileItem.json", "r", encoding="utf-8")
    data = json.load(file)
    return data


# 获取项目源代码-----------------------------------------------------------------------
@app.route("/getSourceCode", methods=["POST"])
def getSourceCode():
    filePath = request.json.get("filePath")  # 获取所有参数
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    file = open(nowPath + nowVersion + "/sourceCode/" + filePath, "r", encoding="utf-8")
    data = {"info": file.read()}
    return data


# 获取每一行代码执行的测试用例-------------------------------------------------------------------
@app.route("/getLineTestCase", methods=["POST"])
def getLineTestCase():
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    f = open(nowPath + nowVersion + "/lineTestCase.json", "r")
    nowData = json.load(f)
    return nowData


# 获取每一行代码所在的函数
@app.route("/getCodeLineInFunc", methods=["POST"])
def getCodeLineInFunc():
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    f = open(nowPath + nowVersion + "/codeLineInFunc.json", "r")
    nowData = json.load(f)
    return nowData


# 获取代码怀疑度-----------------------------------------------------------------------------
@app.route("/getDoubtData", methods=["POST"])
def getDoubtData():
    doubtMethod = request.json.get("doubtMethod")  # 获取所有参数
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    f = open(nowPath + nowVersion + "/allTestDoubt.json", "r")
    nowData = json.load(f)
    useData = {}

    for i in nowData:
        useData[i] = {}
        useData[i] = getDoubtValue(nowData[i], doubtMethod)
    return useData


def getDoubtValue(data, methods):
    aef = data["aef"]
    aep = data["aep"]
    anf = data["anf"]
    anp = data["anp"]
    try:
        if methods == "Tarantula":
            return (aef / (aef + anf)) / (aef / (aef + anf) + aep / (aep + anp))
        if methods == "Jaccard":
            return aef / (aef + anf + aep)
        if methods == "Ochiai":
            return aef / math.sqrt((aef + anf) * (aef + aep))
        if methods == "D*":
            return aef * aef / (anf + aep)
    except:
        return 0


# 获取源代码函数调用结构-------------------------------------------------------------------
@app.route("/getFuncInvokeStatic", methods=["POST"])
def getFuncInvokeStatic():
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    f = open(nowPath + nowVersion + "/funcInvokeStatic.json", "r")
    nowData = json.load(f)
    return nowData


# 获取测试用例运行代码-----------------------------------------------------------------------
@app.route("/getTestRunCode", methods=["POST"])
def getTestRunCode():
    testCaseNum = int(request.json.get("testCaseNum"))  # 获取所有参数
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    useTestCase = getAllUseTestCase()
    if os.path.exists(nowPath + "/runTime.json"):
        if os.path.exists(nowPath + nowVersion + "/" + str(testCaseNum) + "info.json"):
            f = open(
                nowPath + nowVersion + "/" + str(testCaseNum) + "info.json",
                "r",
                encoding="utf-8",
            )
            data = json.load(f)
            return data

    # 通过CMD生成exe文件
    # 通过CMD生成exe文件
    os.system(
        "cd "
        + nowPath
        + nowVersion
        + "/sourceCode"
        + " && gcc print_tokens.c -g -o print_tokens.exe"
    )
    gbdSh = open("gdbList.sh", "w")
    with open(nowPath + nowVersion + "/runData.txt", "w") as f:
        f.write("")
        f.close()
    firstGdbComm = ""
    firstGdbComm += "set logging file " + nowPath + nowVersion + "/runData.txt"
    firstGdbComm += "\nset logging on"
    firstGdbComm += "\nfile " + nowPath + nowVersion + "/sourceCode/print_tokens.exe"
    firstGdbComm += "\nset max-user-call-depth 100000"
    firstGdbComm += "\ndefine br_info"
    firstGdbComm += "\nframe"
    firstGdbComm += "\ninfo args"
    firstGdbComm += "\ninfo locals"
    firstGdbComm += "\nstep"
    firstGdbComm += "\nbr_info"
    firstGdbComm += "\nend"
    firstGdbComm += "\nstart " + useTestCase[testCaseNum - 1]
    firstGdbComm += "\ninfo variables"
    firstGdbComm += "\nbr_info"
    firstGdbComm += "\nset logging off"
    nowGdbFile = open(nowPath + nowVersion + "/gdbList.gdb", "w", encoding="utf-8")
    nowGdbFile.write(firstGdbComm)
    nowGdbFile.close()
    gbdSh.write("gdb --batch --command=" + nowPath + nowVersion + "/gdbList.gdb\n")
    gbdSh.close()
    p = subprocess.Popen(["C:/Program Files/Git/git-bash.exe", "gdbList.sh"])
    p.wait()

    gbdVariSh = open("gbdVari.sh", "w")

    variData = {}
    with open(nowPath + nowVersion + "/vari.txt", "w") as f:
        f.write("")
        f.close()
    secondGdbCom = ""
    secondGdbCom += "file " + nowPath + nowVersion + "/sourceCode/print_tokens.exe"
    secondGdbCom += "\nset print pretty on"
    secondGdbCom += "\nset print elements 0"
    secondGdbCom += "\nset print address on"
    secondGdbCom += "\nset print repeats 0"
    secondGdbCom += "\nset logging file " + nowPath + nowVersion + "/vari.txt"
    secondGdbCom += "\nset logging on"
    secondGdbCom += "\nstart " + useTestCase[testCaseNum - 1]
    text = ""
    with open(nowPath + nowVersion + "/runData.txt", "r") as f:
        text = f.read()
    text = text.split("\n")
    # 判断后续语句是那个语句
    textInfo = 0
    variInfo = {}
    variNum = 1
    displayNum = 0
    useData = {
        "file": [],
        "line": [],
        "code": [],
        "func": [],
        "variables": [],
        "variablesNum": [],
    }
    for i in text:
        if i.startswith("All defined variables:"):
            textInfo = 1
        elif i.startswith("Non-debugging symbols:"):
            textInfo = 0
        elif i.startswith("#0"):
            if textInfo == 3:
                secondGdbCom += "\nstep"
            else:
                textInfo = 3
            i = i.split(" (")
            nowLine = i[1].split(" at ")[-1]
            nowLine = nowLine.split(":")
            useData["file"].append(nowLine[0].strip())
            useData["line"].append(nowLine[1])
            useData["func"].append(i[0].replace("#0", "").strip())
            useData["variables"].append({})
            useData["variablesNum"].append([])
        elif textInfo == 1:
            if i.startswith("File") and "/src/gcc" not in i:
                textInfo = 2
        elif textInfo == 2:
            try:
                nowVariable = i.split(" ")[1].strip(";").split("[")[0]
                secondGdbCom += "\nprint " + nowVariable
                variInfo[variNum] = [nowVariable]
                variNum += 1
                displayNum += 1
            except:
                continue
        elif textInfo == 3:
            # 判断当前是否为输出变量行
            if " = " in i and not re.match("\d+", i):
                nowLine = i.split(" = ")
                secondGdbCom += "\nprint " + nowLine[0]
                variInfo[variNum] = [nowLine[0]]
                useData["variablesNum"][-1].append(variNum)
                variNum += 1
                # 判断当前变量是否为地址--------------------------------------------------
                if nowLine[1].startswith("0x") and len(nowLine[1]) == 8:
                    secondGdbCom += "\nprint *" + nowLine[0]
                    variInfo[variNum] = ["*" + nowLine[0]]
                    useData["variablesNum"][-1].append(variNum)
                    variNum += 1
    secondGdbCom += "\nset logging off"
    nowGdbFile = open(nowPath + nowVersion + "/gdbListVari.gdb", "w", encoding="utf-8")
    nowGdbFile.write(secondGdbCom)
    nowGdbFile.close()
    gbdVariSh.write(
        "gdb --batch --command=" + nowPath + nowVersion + "/gdbListVari.gdb\n"
    )
    gbdVariSh.close()
    p = subprocess.Popen(["C:/Program Files/Git/git-bash.exe", "gbdVari.sh"])
    p.wait()

    variDataFile = open(nowPath + nowVersion + "/vari.txt", "r")
    variData = variDataFile.read()
    variData = variData.split("\n")
    nowVariId = -1
    # 获取每一个变量的最终结果
    for i in variData:
        if re.match("\$\d+", i) and " = " in i:
            i = i.split(" = ", 1)
            nowVariId = int(i[0].replace("$", ""))
            variInfo[nowVariId].append(i[1])
        elif nowVariId >= 0 and (i.startswith(" ") or i == "}"):
            variInfo[nowVariId][-1] += "\n" + i

    # 获取每一行追踪的所有变量
    for i in range(len(useData["variablesNum"])):
        for j in useData["variablesNum"][i]:
            nowValue = setDataFormat(variInfo[j][1])
            useData["variables"][i][variInfo[j][0]] = nowValue
    del useData["variablesNum"]
    useData["definedVari"] = {}
    for i in range(displayNum):
        nowValue = setDataFormat(variInfo[i + 1][1])
        useData["definedVari"][variInfo[i + 1][0]] = nowValue
    # 获取每一行执行的实际代码
    codeText = {}
    for i in useData["file"]:
        if i not in codeText:
            f = open(nowPath + nowVersion + "/sourceCode/" + i, "r")
            code = f.read().split("\n")
            codeText[i] = code
    for j in range(len(useData["line"])):
        useData["code"].append(
            codeText[useData["file"][j]][int(useData["line"][j]) - 1]
        )
        if "/*" in useData["code"][j] and "*/" not in useData["code"][j]:
            useData["code"][j] += "*/"
    # 根据代码所在层级获取代码的缩进值
    func = []
    # 当前代码的层次
    useData["level"] = [0]
    # 当前代码应当空行数
    useData["spaceLen"] = [""]
    spaceLen = [0]
    func = ["main"]
    for i in range(1, len(useData["code"])):
        # 判断当前是否进入新函数
        if useData["func"][i] != useData["func"][i - 1]:
            # 判断新函数是否为当前执行函数跳入
            if useData["func"][i] in useData["code"][i - 1]:
                func.append(useData["func"][i])
                newspaceLen = 0
                for k in useData["code"][i - 1]:
                    if k.isspace():
                        newspaceLen += 1
                    else:
                        spaceLen.append(newspaceLen)
                        break
            # 判断是否为返回上一级的函数
            if func[-2] == useData["func"][i]:
                func.pop()
                spaceLen.pop()
                # 表明进入了一个新函数
            else:
                func.pop()
                func.append(useData["func"][i])
        useData["code"][j] = " " * spaceLen[-1] + useData["code"][j]
        useData["spaceLen"].append(spaceLen[-1] * " ")
        useData["level"].append(len(spaceLen) - 1)
    for i in range(len(useData["code"])):
        useData["code"][i] += "\n"

    # 获取每一行代码的id(判断是否为同一个变量)
    # 当前的id最大值,只加不减
    idList = 0
    # 当前实际id
    nowId = 0
    # 当前id的父Id
    parentId = -1
    useData["lineId"] = [
        {"id": nowId, "parentId": parentId},
    ]
    lineId = {nowId: {"id": nowId, "parentId": parentId}}
    for i in range(1, len(useData["level"])):
        # 如果当前层级和上一层的层级相同
        if useData["level"][i] == useData["level"][i - 1]:
            # 判断是否为同一个函数和文件
            if (
                useData["func"][i] == useData["func"][i - 1]
                and useData["file"][i] == useData["file"][i - 1]
            ):
                useData["lineId"].append({"id": nowId, "parentId": parentId})
            # 如果不是，则表明是一个新id
            else:
                idList += 1
                nowId = idList
                useData["lineId"].append({"id": nowId, "parentId": parentId})
                lineId[nowId] = {"id": nowId, "parentId": parentId}
        # 当前进入了下一个层级
        elif useData["level"][i] > useData["level"][i - 1]:
            # 则当前Id即为该层id的父id
            parentId = nowId
            idList += 1
            nowId = idList
            useData["lineId"].append({"id": nowId, "parentId": parentId})
            lineId[nowId] = {"id": nowId, "parentId": parentId}
        # 返回了上一个层级
        else:
            nowId = parentId
            parentId = lineId[nowId]["parentId"]
            useData["lineId"].append(lineId[nowId])

    with open(nowPath + nowVersion + "/" + str(testCaseNum) + "info.json", "w") as f:
        f.write(json.dumps(useData))
        f.close()
    return useData


# 保存程序运行数据
def getAllUseTestCase():
    useTestCase = []
    testCase = open("./data/print_tokens/scripts/runall.sh", "r", encoding="utf-8")
    # 修改输入的测试用例内容，确保路径正确
    for i in testCase:
        if i.startswith("../source/print_tokens.exe"):
            inputData = i.split(" ", 1)[1]
            inputData = inputData.split(" > ", 1)[0].replace("<", "").strip()
            if inputData.startswith("../"):
                useTestCase.append(
                    "./data/" + inputData.replace("../inputs", "print_tokens/inputs")
                )
            else:
                useTestCase.append(
                    os.getcwd().replace("\\", "/")
                    + "/data/"
                    + inputData.replace("../inputs", "print_tokens/inputs")
                )
    return useTestCase


# 将gdb获取的数据格式化
def setDataFormat(data):
    if data.startswith("{") and data.endswith("}"):
        if "\n" in data:
            result = {}
            data = data.split("\n")
            for i in data[1:-1]:
                i = i.split(" = ", 1)
                result[i[0].strip()] = setDataFormat(i[1].strip())
            return result
        else:
            data = json.loads("[" + data.strip("{").strip("}") + "]")
            return data
    else:
        return data


# 获取代码执行后的函数调用层级结构等信息----------------------------------------------------------------
@app.route("/getRunCodeLineFuncLevel", methods=["POST"])
def getRunCodeLineFuncLevel():
    testCaseNum = int(request.json.get("testCaseNum"))  # 获取所有参数
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    if os.path.exists(nowPath + nowVersion + "/runTime.json"):
        if os.path.exists(
            nowPath + nowVersion + "/" + str(testCaseNum) + "lineFuncLevel.json"
        ):
            f = open(
                nowPath + nowVersion + "/" + str(testCaseNum) + "lineFuncLevel.json",
                "r",
                encoding="utf-8",
            )
            data = json.load(f)
            return data
    f = open(nowPath + nowVersion + "/" + str(testCaseNum) + "info.json", "r")
    runCodeData = json.load(f)
    lastId = -1
    useId = []
    for i in range(len(runCodeData["lineId"])):
        nowData = runCodeData["lineId"][i]
        if nowData["id"] != lastId:
            useId.append(
                {
                    "func": runCodeData["func"][i],
                    "level": runCodeData["level"][i],
                    "line": [i + 1],
                }
            )
            lastId = nowData["id"]
        else:
            useId[-1]["line"].append(i + 1)
    f = open(
        nowPath + nowVersion + "/" + str(testCaseNum) + "lineFuncLevel.json",
        "w",
        encoding="utf-8",
    )
    f.write(json.dumps(useId))
    return useId


# 获取代码执行后当前函数的实际调用信息----------------------------------------------------------------
@app.route("/getRunCodeFuncInvoke", methods=["POST"])
def getRunCodeFuncInvoke():
    testCaseNum = int(request.json.get("testCaseNum"))  # 获取所有参数
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    f = open(nowPath + nowVersion + "/" + str(testCaseNum) + "lineFuncLevel.json", "r")
    lineFuncLevel = json.load(f)
    runFunc = []
    runFuncInvoke = []
    nowLevel = 0
    nowFunc = ""
    for i in lineFuncLevel:
        runFunc.append(i["func"])
        if i["level"] > nowLevel:
            runFuncInvoke.append(nowFunc + "->" + i["func"])
        nowLevel = i["level"]
        nowFunc = i["func"]
    runFunc = list(set(runFunc))
    runFuncInvoke = list(set(runFuncInvoke))
    useFuncInvoke = []
    for i in runFuncInvoke:
        useFuncInvoke.append(i.split("->"))
    return useFuncInvoke


# 获取代码执行后的分支跳转信息----------------------------------------------------------------
@app.route("/getRunCodeBranchSkip", methods=["POST"])
def getRunCodeBranchSkip():
    testCaseNum = int(request.json.get("testCaseNum"))  # 获取所有参数
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    if os.path.exists(nowPath + nowVersion + "/runTime.json"):
        if os.path.exists(
            nowPath + nowVersion + "/" + str(testCaseNum) + "branchSkip.json"
        ):
            f = open(
                nowPath + nowVersion + "/" + str(testCaseNum) + "branchSkip.json",
                "r",
                encoding="utf-8",
            )
            data = json.load(f)
            return data
    f = open(nowPath + nowVersion + "/" + str(testCaseNum) + "info.json", "r")
    runCodeData = json.load(f)
    useLine = []
    useCodeSkip = []
    while len(useLine) < len(runCodeData["line"]):
        nowLevel = -1
        nowLine = -1
        for i in range(len(runCodeData["line"])):
            if nowLevel < 0 and i not in useLine:
                useLine.append(i)
                nowLine = runCodeData["line"][i]
                nowLevel = runCodeData["level"][i]
            elif nowLevel >= 0 and runCodeData["level"][i] == nowLevel:
                useCodeSkip.append(str(nowLine) + "->" + str(runCodeData["line"][i]))
                nowLine = runCodeData["line"][i]
            elif nowLevel >= 0 and runCodeData["level"][i] < nowLevel:
                break
    f = open(
        nowPath + nowVersion + "/" + str(testCaseNum) + "branchSkip.json",
        "w",
        encoding="utf-8",
    )
    useCodeSkip = list(set(useCodeSkip))
    f.write(json.dumps(useCodeSkip))
    return useCodeSkip


# 获取源代码的控制流图信息-------------------------------------------------------------------
@app.route("/getFunCFG", methods=["POST"])
def getFunCFG():
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    f = open(nowPath + nowVersion + "/FunCFG.json", "r")
    nowData = json.load(f)
    return nowData


# 获取源代码的代码块的跳转数据-------------------------------------------------------------------
@app.route("/getBranchSkip", methods=["POST"])
def getBranchSkip():
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参数
    f = open(nowPath + nowVersion + "/branchSkip.json", "r")
    nowData = json.load(f)
    return nowData


# 获取当前测试用例的输入和代码的实际输出
@app.route("/getTestOutput", methods=["POST"])
def getTestOutput():
    testCaseNum = str(request.json.get("testCaseNum"))  # 获取所有参数
    nowVersion = str(request.json.get("nowVersion"))  # 获取所有参
    nowDir = os.getcwd().replace("\\", "/")
    rightOutputs = open(nowDir + "/data/print_tokens0/resultData.json", "r")
    rightResult = json.load(rightOutputs)

    if not os.path.exists(nowPath + nowVersion + "/outputs/t" + testCaseNum):
        os.system(
            "cd "
            + nowPath
            + nowVersion
            + "/sourceCode"
            + " && gcc print_tokens.c -g -o print_tokens.exe"
        )
        buff = []
        file_name = "./data/print_tokens/scripts/runall.sh"
        # 打开原来的runall.ps1文件，并把所有语句进行记录保存
        with open(file_name) as file_obj:
            for content in file_obj:
                if "print_tokens.exe" in content:
                    content = content.replace("../source/", "./")
                    content = content.replace(
                        "../inputs/", "../../../print_tokens/inputs/"
                    )
                    buff.append(content)
        nowShList = open(nowPath + nowVersion + "/nowTest.sh", "w")
        nowShList.write("cd " + nowPath + nowVersion + "/sourceCode\n")
        nowShList.write(buff[int(testCaseNum) - 1])
        nowShList.close()
        p = subprocess.Popen(
            ["C:/Program Files/Git/git-bash.exe", nowPath + nowVersion + "/nowTest.sh"]
        )
        p.wait()
    nowOutputs = open(nowPath + nowVersion + "/outputs/t" + testCaseNum, "r")
    nowResult = nowOutputs.read()
    useData = []
    if rightResult[testCaseNum] == nowResult:
        useData.append("true")
    else:
        useData.append("false")
    useData.append(rightResult[testCaseNum])
    useData.append(nowResult)
    return useData


# 获取新更改的代码--------------------------------------------------------------------------------
@app.route("/getNewVersionCode", methods=["POST"])
def getNewVersionCode():
    nowVersion = str(request.json.get("nowVersion"))
    nowFile = request.json.get("nowFile")
    nowCode = request.json.get("nowCode")
    beforeCode = ""
    lastVersion = "v" + str(int(nowVersion.replace("v", "")) - 1)
    if not os.path.exists(nowPath + nowVersion):
        # 将输入文件提取出来
        source_path = os.path.abspath(nowPath + lastVersion + "/sourceCode")
        target_path = os.path.abspath(nowPath + nowVersion + "/sourceCode")
        shutil.copytree(source_path, target_path)
        os.mkdir(nowPath + nowVersion + "/outputs")

    f = open(nowPath + lastVersion + "/sourceCode/" + nowFile, "r")
    beforeCode = f.read()
    f = open(nowPath + nowVersion + "/sourceCode/" + nowFile, "w")
    f.write(nowCode)
    d = difflib.HtmlDiff()
    htmlcontent = d.make_file(
        beforeCode.splitlines(keepends=True), nowCode.splitlines(keepends=True)
    )
    with open(nowPath + nowVersion + "/codeChangeDiff.html", "w") as f:
        f.write(htmlcontent)

    f = open(nowPath + nowVersion + "/codeChangeDiff.html", "r")
    Soup = BeautifulSoup(f.read(), "html.parser")
    line = Soup.select("table.diff > tbody > tr")

    f = open(nowPath + "codeChangeHistory.json", "r", encoding="utf-8")
    nowDiffData = json.load(f)
    nowDiffData[nowVersion] = []
    # 判断每一行是否有对应行，是否被修改
    for i in line:
        for j in i.find_all("td", attrs={"nowrap": "nowrap"}):
            if (
                len(j.select("span.diff_sub")) == 0
                and len(j.select("span.diff_chg")) == 0
                and len(j.select("span.diff_add")) == 0
            ):
                continue
            else:
                nowLine = []
                lastLine = []
                lineNum = -1
                nowLineNum = -1
                for k in i.select("td"):
                    nowAttr = k.attrs
                    if "class" not in nowAttr:
                        nowAttr["class"] = [""]
                    if nowAttr["class"][0] == "diff_header":
                        lineNum = str(k.get_text())
                        nowLineNum += 1
                        if nowLineNum == 0:
                            nowLine.append([lineNum, "nowline"])
                        else:
                            lastLine.append([lineNum, "beforeline"])
                    elif nowAttr["class"][0] != "diff_next":
                        if nowLineNum == 0:
                            for l in k.contents:
                                try:
                                    nowLine.append(
                                        [
                                            " ".join(str(l.text).split()),
                                            l.attrs["class"][0],
                                        ]
                                    )
                                except:
                                    nowLine.append([" ".join(str(l).split())])
                        else:
                            for l in k.contents:
                                try:
                                    lastLine.append(
                                        [
                                            " ".join(str(l.text).split()),
                                            l.attrs["class"][0],
                                        ]
                                    )
                                except:
                                    lastLine.append([" ".join(str(l).split())])
                nowDiffData[nowVersion].append([nowLine, lastLine])
                break
    f = open(nowPath + "codeChangeHistory.json", "w")
    f.write(json.dumps(nowDiffData))
    f.close()
    getSourceCodeNew(nowVersion)
    getFuncStatic(nowVersion)
    getCodeBranch(nowVersion)
    return []


# 获取项目源代码，以及项目目录结构
def getSourceCodeNew(nowVersion):
    def retrieveDir(dir):
        p = Path(dir)
        DirTree = []
        for p in list(p.glob("*")):
            if p.is_file():
                path = os.path.join(p).replace("\\", "/")
                DirTree.append(
                    {
                        "label": p.name,
                        "value": "file",
                        "key": path,
                    }
                )
            else:
                subdir = []
                subdir = retrieveDir(os.path.join(dir, p.name))
                DirTree.append(
                    {"key": p.name, "label": p.name, "value": "dir", "children": subdir}
                )
        return DirTree

    dirTree = retrieveDir(nowPath + nowVersion + "/sourceCode")
    fileItem = {"key": "src", "label": "src", "value": "dir", "children": dirTree}
    file = open(nowPath + nowVersion + "/fileItem.json", "w")
    file.write(json.dumps([fileItem]))
    file.close()


# 获取代码逻辑内的函数调用关系
def getFuncStatic(nowVersion):
    os.system(
        "cd "
        + nowPath
        + nowVersion
        + "/sourceCode/ && gcc print_tokens.c -g -o print_tokens.exe"
    )
    gdbmi = GdbController()
    response = gdbmi.write(
        "file " + nowPath + nowVersion + "/sourceCode/print_tokens.exe"
    )
    response = gdbmi.write("info functions")
    isFuncName = {}
    isFunc = False
    isFile = False
    fileName = ""
    for j in response:
        if j["payload"] == "All defined functions:\n":
            isFunc = True
        elif isFunc:
            if j["payload"] == "\nFile ":
                isFile = True
            elif isFile:
                fileName = j["payload"].strip(":\n")
                isFile = False
            elif j["payload"] == "\nNon-debugging symbols:\n":
                break
            else:
                if j["payload"].startswith("static "):
                    j["payload"] = j["payload"].replace("static ", "")
                func = j["payload"].split(" ", 1)
                funcName = func[1].split("(")
                isFuncName[funcName[0].strip()] = [fileName, func[0]]
    allUsetTest = getAllUseTestCase()
    # 获取代码的CFG文件并进行解析
    file_obj = open(
        nowPath + nowVersion + "/sourceCode/runall_test.sh",
        mode="w+",
    )
    file_obj.write("cd " + nowPath + nowVersion + "/sourceCode\n")

    file_obj.write(allUsetTest[0] + "\n")
    file_obj.write("gcov print_tokens.c\n")
    file_obj.write("mv print_tokens.c.gcov ../outputs\n")
    file_obj.write("rm print_tokens.exe\n")
    file_obj.close()
    p = subprocess.Popen(
        [
            "C:/Program Files/Git/git-bash.exe",
            nowPath + nowVersion + "/sourceCode/runall_test.sh",
        ]
    )
    p.wait()
    f = open(nowPath + nowVersion + "/outputs/print_tokens.c.gcov", "r")
    codeData = f.read().split("\n")
    nowSourceFile = ""
    nowLevel = 0
    isAnnotation = False
    funcStaicData = {}
    argsLevel = 0
    lineInFunc = {}
    for j in codeData:
        # 如果以0：开头则表示不是相关语句
        if j == "":
            continue
        if isAnnotation:
            # 判断当前行注释是否结束
            if "*/" in j:
                isAnnotation = False
                if j.endswith("*/"):
                    continue
            else:
                continue
        # 判断当前行是否有注释
        if "/*" in j:
            isAnnotation = True
            if "*/" in j:
                isAnnotation = False
            elif j.split(":", 2)[2].startswith("/*"):
                continue

        if j.split(":", 1)[1].strip().startswith("0:"):
            nowSourceData = j.split(":", 1)[1].strip()
            if "0:Source:" in nowSourceData:
                nowSourceFile = nowSourceData.strip("0:Source:").replace(".", "__")
            continue
        # 当前代码行号
        nowLineNum = int(j.split(":", 2)[1].strip())
        if nowSourceFile in isFuncName.keys():
            lineInFunc[nowLineNum] = nowSourceFile
        # 当前代码行的内容
        nowLineCode = j.split(":", 2)[2]
        if "{" in nowLineCode:
            nowLevel += 1
        if "}" in nowLineCode:
            nowLevel -= 1

        if nowLevel == 0:
            for k in isFuncName:
                # 如果当前层级为0，且当前行代码包含函数名，则表明当前行为函数定义
                if k in nowLineCode:
                    nowSourceFile = k
                    funcStaicData[nowSourceFile] = {
                        "file": isFuncName[k][0],
                        "funcType": isFuncName[k][1],
                        "funcArgs": nowLineCode.split("(")[1]
                        .split(")")[0]
                        .replace(" ", "")
                        .split(","),
                        "children": [],
                    }
        elif nowLevel > 0:
            if argsLevel > 0:
                args = ""
                for l in nowLineCode:
                    # 判断（）的数量，当>1时，里面的内容则为参数，用","判断参数数量
                    if l == "(":
                        argsLevel += 1
                    elif l == ")":
                        argsLevel -= 1
                    if argsLevel >= 1:
                        if l == "," and argsLevel == 1:
                            args += ";"
                        elif l == "(" and argsLevel == 1:
                            continue
                        else:
                            args += l
                if argsLevel < 0:
                    argsLevel = 0
                funcStaicData[nowSourceFile]["children"][-1] += args.strip()
            else:
                for k in isFuncName:
                    if k + "(" in nowLineCode:
                        argsStr = nowLineCode.split(k, 1)[1]
                        args = ""
                        for l in argsStr:
                            # 判断（）的数量，当>1时，里面的内容则为参数，用","判断参数数量
                            if l == "(":
                                argsLevel += 1
                            elif l == ")":
                                argsLevel -= 1
                            if argsLevel >= 1:
                                if l == "," and argsLevel == 1:
                                    args += ";"
                                elif l == "(" and argsLevel == 1:
                                    continue
                                else:
                                    args += l
                        if argsLevel < 0:
                            argsLevel = 0
                        funcStaicData[nowSourceFile]["children"].append(
                            k + ":" + str(args)
                        )
    for j in funcStaicData:
        funcStaicData[j]["children"] = list(set(funcStaicData[j]["children"]))
    f = open(nowPath + nowVersion + "/funcInvokeStatic.json", "w")
    f.write(json.dumps(funcStaicData))
    f = open(nowPath + nowVersion + "/codeLineInFunc.json", "w")
    f.write(json.dumps(lineInFunc))


# 获取代码分支数据
def getCodeBranch(nowVersion):
    """
    gcc -fdump-tree-cfg-lineno print_tokens.c -o print_tokens 获取程序的cfg图
    """
    # 获取代码的CFG文件并进行解析
    file_obj = open(
        nowPath + nowVersion + "/sourceCode/runcfg.sh",
        mode="w",
    )
    file_obj.write("cd " + nowPath + nowVersion + "/sourceCode\n")
    file_obj.write("gcc -fdump-tree-cfg-lineno print_tokens.c -o print_tokens\n")
    file_obj.close()
    p = subprocess.Popen(
        [
            "C:/Program Files/Git/git-bash.exe",
            nowPath + nowVersion + "/sourceCode/runcfg.sh",
        ]
    )
    p.wait()
    cfgFile = open(
        nowPath + nowVersion + "/sourceCode/print_tokens.c.011t.cfg",
        "r",
    )
    cfgData = cfgFile.readlines()
    f = open(nowPath + nowVersion + "/funcInvokeStatic.json", "r")
    funcData = json.load(f)
    f.close()
    funCFG = {}
    for j in funcData:
        funCFG[j] = {"node": {}, "link": []}
    nowFunc = ""
    isStart = False
    nowNode = ""

    # 读取文件内容并解析
    for j in cfgData:
        if j.startswith(";;"):
            continue
        j = j.strip()

        # 当前行是文件的代码定义行
        if "(" in j and ")" in j:
            lineFunc = j.split(" ", 1)
            if lineFunc[0] in funCFG:
                nowFunc = lineFunc[0]
                continue
        # 后续内容为函数的CFG定义
        if nowFunc != "" and j == "{":
            isStart = True
            continue
        if isStart:
            if j.startswith("[0:0]"):
                endNode = j.split("<")[1].replace(">;", "")
                funCFG[nowFunc]["link"].append([nowNode, endNode])
                continue
            # 当前行是否为代码块定义
            if j.startswith("<"):
                nowNode = j.split(">")[0].replace("<", "")
                if nowNode not in funCFG[nowFunc]["node"]:
                    funCFG[nowFunc]["node"][nowNode] = []
            else:
                # 遇到switch函数特殊处理
                if "switch" in j:
                    jSplitLine = j.split("[print_tokens.c:")
                    for k in jSplitLine:
                        if k == "":
                            continue
                        if "switch" in k:
                            nowline = k.split(":")[0]
                            funCFG[nowFunc]["node"][nowNode].append(nowline)
                        else:
                            nowline = k.split(":")[0]
                            endNode = k.split(" <")[1].split(">")[0]
                            if endNode not in funCFG[nowFunc]["node"]:
                                funCFG[nowFunc]["node"][endNode] = []
                            funCFG[nowFunc]["node"][endNode].append(nowline)
                            funCFG[nowFunc]["link"].append([nowNode, endNode])
                    continue
                if j.startswith("["):

                    # 读取当前代码块所在行号
                    jSplitLine = j.split("[print_tokens.c:")
                    for k in jSplitLine:
                        if k == "":
                            continue
                        k = k.split(":")[0]
                        funCFG[nowFunc]["node"][nowNode].append(k)

                # 读取代码块的跳转信息
                if "goto <" in j and j.endswith(";"):
                    jSplitLink = j.split("goto <")[1]
                    if "(" in jSplitLink:
                        endNode = jSplitLink.split("(<")[1].replace(">);", "")
                        funCFG[nowFunc]["link"].append([nowNode, endNode])
                    else:
                        endNode = jSplitLink.replace(">;", "")
                        funCFG[nowFunc]["link"].append([nowNode, endNode])
        if j == "}":
            isStart = False
    for j in funCFG:
        for k in funCFG[j]["node"]:
            funCFG[j]["node"][k] = list(set(funCFG[j]["node"][k]))
            funCFG[j]["node"][k].sort()
            if len(funCFG[j]["node"][k]) == 0:
                funCFG[j]["node"][k].append(-1)

    # 读取每一行代码所在的代码块
    mergeData = {}
    for j in funCFG:
        mergeData[j] = {}
        for k in funCFG[j]["node"]:
            for l in funCFG[j]["node"][k]:
                if l not in mergeData[j].keys():
                    mergeData[j][l] = []
                mergeData[j][l].append([k, len(funCFG[j]["node"][k])])

    # 如果一行代码有多个代码块，则将代码块进行合并
    for j in mergeData:
        for k in mergeData[j]:
            max = 0
            blockChange = ""
            if len(mergeData[j][k]) <= 1:
                continue
            for l in mergeData[j][k]:
                if l[1] > max:
                    max = l[1]
                    blockChange = l[0]
            delBlock = []
            for l in mergeData[j][k]:
                if l[0] != blockChange and l[1] == 1:
                    delBlock.append(l[0])
            for l in delBlock:
                del funCFG[j]["node"][l]
            for l in funCFG[j]["link"]:
                for m in delBlock:
                    if l[0] == m:
                        l[0] = blockChange
                    elif l[1] == m:
                        l[1] = blockChange

    for j in funCFG:
        funCFG[j]["edges"] = []
        allEdges = []
        for k in funCFG[j]["link"]:
            if k[0] != k[1]:
                if k[0] + "->" + k[1] not in allEdges:
                    funCFG[j]["edges"].append(k)
                    allEdges.append(k[0] + "->" + k[1])
        del funCFG[j]["link"]
    f = open(nowPath + nowVersion + "/funCFG.json", "w")
    f.write(json.dumps(funCFG))
    branchSkip = {}
    for j in funCFG:
        for k in funCFG[j]["edges"]:
            branchSkip[
                str(funCFG[j]["node"][k[0]][-1])
                + "->"
                + str(funCFG[j]["node"][k[1]][0])
            ] = [k[0], k[1], j]

    f = open(nowPath + nowVersion + "/branchSkip.json", "w")
    f.write(json.dumps(branchSkip))
    lineInFuncBlock = {}
    for j in funCFG:
        for k in funCFG[j]["node"]:
            for l in funCFG[j]["node"][k]:
                lineInFuncBlock[l] = j + ": " + k
    f = open(nowPath + nowVersion + "/lineInFuncBlock.json", "w")
    f.write(json.dumps(lineInFuncBlock))


# 获取代码更改历史----------------------------------------------------------
@app.route("/getCodeChangeHistory", methods=["GET"])
def getCodeChangeHistory():
    # 判断当前测试用例是否执行改行代码，如果执行，则表明受到了影响
    f = open(nowPath + "codeChangeHistory.json", "r")
    nowDiffData = json.load(f)
    return nowDiffData


@app.route("/getNewVersionData", methods=["POST"])
def getNewVersionData():
    nowVersion = str(request.json.get("nowVersion"))
    # 为8个版本分别创建测试用例
    buff = []
    file_name = "./data/print_tokens/scripts/runall.sh"
    # 打开原来的runall.ps1文件，并把所有语句进行记录保存
    with open(file_name) as file_obj:
        for content in file_obj:
            if "print_tokens.exe" in content:
                content = content.replace("../source/", "./")
                content = content.replace("../inputs/", "../../../print_tokens/inputs/")
            buff.append(content)
    """cd
      创建测试用例的相关脚本 echo ">>>>>>>>running test 1"
      ./print_tokens.exe  < ../../../print_tokens/inputs/newtst148.tst > ../../../outputs/v0/v0.0/t1
    """
    createV(buff, nowVersion)
    """
      创建获取执行过程的相关脚本
      echo ">>>>>>>>running test 1"
      gcc -fprofile-arcs -ftest-coverage print_tokens.c -o print_tokens.exe
      ./print_tokens.exe  < ../../../print_tokensinputs/newtst148.tst > ../../../outputs/v0//t1
      gcov print_tokens.c
      cp print_tokens.c.gcov ../../../outputs/v0/t1_print_tokens.c.gcov
      rm print_tokens.exe
    """
    createAllV(buff, nowVersion)
    """
      gcc -fprofile-arcs -ftest-coverage print_tokens.c -o print_tokens.exe
      ./runall.sh
      gcov print_tokens.c
      mv print_tokens.c.gcov ../../../outputs/v0
      rm print_tokens.exe
    """
    allThread = []
    for i in range(0, 8):
        allThread.append(Thread(target=createTest, args=(i, nowVersion)))

    for i in range(0, 8):
        allThread[i].start()
    for i in range(0, 8):
        allThread[i].join()
    print("所有线程已完成")
    for i in range(0, 8):
        shutil.rmtree(nowPath + nowVersion + "/sourceCode" + str(i))
    """
    "0": [
    "right",
    351,
    "error,\t\"\".\nidentifier,\t\"J0Bey\".\ncomma.\neof.\n"
    ],
    """
    getRunTime(nowVersion)
    getSourceCodeNew(nowVersion)
    getFuncStatic(nowVersion)
    getCodeBranch(nowVersion)
    return []


# 创建测试用例的相关脚本
def createV(buff, nowVersion):
    # 为8个版本分别创建测试用例的相关脚本
    if not os.path.exists(nowPath + nowVersion + "/outputs"):
        os.mkdir(nowPath + nowVersion + "/outputs")
    fileList = []
    source_path = os.path.abspath(nowPath + nowVersion + "/sourceCode")

    file = open(
        source_path + "/runall.sh",
        mode="w",
    )
    for j in range(0, 8):

        target_path = os.path.abspath(nowPath + nowVersion + "/sourceCode" + str(j))
        if os.path.exists(target_path):
            shutil.rmtree(target_path)
        shutil.copytree(source_path, target_path)
        fileList.append(
            open(
                target_path + "/runall.sh",
                mode="w",
            )
        )
    allTestNum = 0
    for content in buff:
        file.write(content)
        fileList[allTestNum].write(content)
        if "print_tokens.exe" in content:
            allTestNum = (allTestNum + 1) % 8


# 创建获取执行过程的相关脚本
def createAllV(buff, nowVersion):
    # 为所有版本创建获取执行过程的相关脚本
    fileList = []
    file = open(
        nowPath + nowVersion + "/sourceCode/runall_gcov.sh",
        mode="w",
    )
    for j in range(0, 8):
        fileList.append(
            open(
                nowPath + nowVersion + "/sourceCode" + str(j) + "/runall_gcov.sh",
                mode="w",
            )
        )
        fileList[j].write(
            "gcc -fprofile-arcs -ftest-coverage print_tokens.c -o print_tokens.exe\n"
        )
    j = 0
    allTestNum = 0
    for content in buff:
        # 改变输出和输入文件的位置
        if "print_tokens.exe" in content:
            fileList[allTestNum].write(content)
            fileList[allTestNum].write("gcov print_tokens.c\n")
            fileList[allTestNum].write(
                "cp print_tokens.c.gcov ../outputs/t"
                + str(j + 1)
                + "_print_tokens.c.gcov\n"
            )
            file.write(content)
            file.write("gcov print_tokens.c\n")
            file.write(
                "cp print_tokens.c.gcov ../outputs/t"
                + str(j + 1)
                + "_print_tokens.c.gcov\n"
            )
            j = j + 1
            allTestNum = (allTestNum + 1) % 8
            continue
        fileList[allTestNum].write(content)
        file.write(content)


# 创建自动执行所有测试用例的脚本
def createTest(threadNum, nowVersion):
    print("第" + str(threadNum) + "个线程已开始")
    file_obj = open(
        nowPath + nowVersion + "/sourceCode" + str(threadNum) + "/runall_test.sh",
        mode="w+",
    )
    file_obj.write("cd " + nowPath + nowVersion + "/sourceCode" + str(threadNum) + "\n")

    file_obj.write("./runall.sh\n")
    file_obj.write("gcov print_tokens.c\n")
    file_obj.write("mv print_tokens.c.gcov ../outputs\n")
    file_obj.write("rm print_tokens.exe\n")
    file_obj.write("./runall_gcov.sh\n")
    file_obj.close()
    p = subprocess.Popen(
        [
            "C:/Program Files/Git/git-bash.exe",
            nowPath + nowVersion + "/sourceCode" + str(threadNum) + "/runall_test.sh",
        ]
    )
    p.wait()
    print("已完成第" + str(threadNum) + "个线程")


# 获取每一个测试用例的执行次数，以及对错
def getRunTime(nowVersion):
    file_correct = open("./data/print_tokens0/resultData.json", "r")
    rightResult = json.load(file_correct)
    file_correct = open(nowPath + "runTime.json", "r")
    result = json.load(file_correct)
    resultMatrix = {}
    lineTestMatrix = {}
    timeMatrix = []
    for j in range(0, 8):
        timeMatrix.append([])
    for j in range(0, 4130):
        nowThread = j % 8
        # 取出相应测试用例的的执行频谱
        file_correct = open(
            nowPath + nowVersion + "/outputs/t" + str(j + 1) + "_print_tokens.c.gcov",
            mode="r",
        )
        # 将变异版本的测试用例的结果取出
        file_test = open(
            nowPath + nowVersion + "/outputs/t" + str(j + 1),
            mode="r",
        )
        test = file_test.read()
        runTimeNow = 0
        nowTestResult = rightResult[str(j + 1)] == test
        nowLine = 1
        for content in file_correct:
            if content.split(":", 1)[1].strip().startswith("0:"):
                continue
            if nowLine not in resultMatrix:
                for k in range(0, 8):
                    timeMatrix[k].append(0)
                resultMatrix[nowLine] = []
                lineTestMatrix[nowLine] = []
            content = content.split(":", 1)[0]
            if not "-" in content and not "#####" in content:
                nowLineData = int(content) - timeMatrix[nowThread][nowLine - 1]
                runTimeNow += nowLineData
                timeMatrix[nowThread][nowLine - 1] = int(content)
                if nowLineData > 0:
                    lineTestMatrix[nowLine].append(j + 1)
                    if nowTestResult:
                        resultMatrix[nowLine].append(1)
                    else:
                        resultMatrix[nowLine].append(3)
                else:
                    if nowTestResult:
                        resultMatrix[nowLine].append(0)
                    else:
                        resultMatrix[nowLine].append(2)
            else:
                if nowTestResult:
                    resultMatrix[nowLine].append(0)
                else:
                    resultMatrix[nowLine].append(2)
            nowLine += 1

        # 判断结果是否相同
        result[str(j + 1)][nowVersion] = [str(nowTestResult), runTimeNow, test]
    file = open(nowPath + "runTime.json", mode="w")  # 代码执行次数
    file.write(json.dumps(result))

    resultTestNum = {}
    for j in resultMatrix:
        resultTestNum[j] = {
            "aef": resultMatrix[j].count(3),
            "aep": resultMatrix[j].count(1),
            "anf": resultMatrix[j].count(2),
            "anp": resultMatrix[j].count(0),
        }

    file = open(nowPath + nowVersion + "/allTestDoubt.json", mode="w")  # 结果矩阵
    file.write(json.dumps(resultTestNum))

    file = open(nowPath + nowVersion + "/lineTestCase.json", mode="w")  # 结果矩阵
    file.write(json.dumps(lineTestMatrix))
    file = open(nowPath + nowVersion + "/speMatrix.json", mode="w")  # 结果矩阵
    file.write(json.dumps(resultMatrix))
