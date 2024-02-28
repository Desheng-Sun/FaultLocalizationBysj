import configparser
import os
from threading import Thread
from pygdbmi.gdbcontroller import GdbController
import subprocess
import shutil
from pathlib import Path
import json
import difflib
from alive_progress import alive_bar
import pycparser

projectName = "print_tokens"


# 对项目目录结构进行重构
def changeFileItem():
    # 将其他几个版本的文件提取出来
    for i in range(0, 8):
        source_path = os.path.abspath(
            "./data/" + projectName + "/versions.alt/versions.orig/v" + str(i)
        )
        target_path = os.path.abspath(
            "./data/" + projectName + str(i) + "/v0/sourceCode"
        )
        shutil.copytree(source_path, target_path)


# 获取项目源代码，以及项目目录结构
def getSourceCode():
    # 为8个版本分别获取对应的源代码
    # nowPath = os.getcwd().replace("\\", "/")
    # def retrieveDir(dir):
    #     p = Path(dir)
    #     DirTree = []
    #     for p in list(p.glob("*")):
    #         if p.is_file():
    #             path = os.path.join(p).replace("\\", "/")
    #             DirTree.append({
    #                 "name": p.name,
    #                 "value": "file",
    #                 "path": path
    #             })
    #         else:
    #             subdir = []
    #             subdir = retrieveDir(os.path.join(
    #                 dir, p.name))
    #             DirTree.append({
    #                 "name": p.name,
    #                 "value": "dir",
    #                 "children": subdir
    #             })
    #     return DirTree
    # 为8个版本分别获取对应的源代码
    nowPath = os.getcwd().replace("\\", "/")

    def retrieveDir(dir):
        p = Path(dir)
        DirTree = []
        for p in list(p.glob("*")):
            if p.is_file():
                path = os.path.join(p).replace("\\", "/")

                if (
                    p.name.endswith(".c")
                    or p.name.endswith(".cpp")
                    or p.name.endswith(".h")
                ):
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

    for i in range(0, 8):
        dirTree = retrieveDir(
            nowPath + "/data/" + projectName + str(i) + "/v0/sourceCode"
        )
        fileItem = {"key": "src", "label": "src", "value": "dir", "children": dirTree}
        file = open("./data/" + projectName + str(i) + "/v0/fileItem.json", "w")
        file.write(json.dumps(fileItem))
        file = open("./data/" + projectName + str(i) + "/codeChangeHistory.json", "w")
        file.write(json.dumps({"v0": {}}))


# 创建测试用例的相关脚本
def createV(buff):
    # 为8个版本分别创建测试用例的相关脚本
    for i in range(0, 8):
        if not os.path.exists("./data/" + projectName + str(i) + "/v0/outputs"):
            os.mkdir("./data/" + projectName + str(i) + "/v0/outputs")
        fileList = []
        source_path = os.path.abspath(
            "./data/" + projectName + str(i) + "/v0/sourceCode"
        )

        file = open(
            source_path + "/runall.sh",
            mode="w",
        )
        for j in range(0, 8):

            target_path = os.path.abspath(
                "./data/" + projectName + str(i) + "/v0/sourceCode" + str(j)
            )
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
def createAllV(buff):
    # 为所有版本创建获取执行过程的相关脚本
    for i in range(0, 8):
        fileList = []
        file = open(
            "./data/" + projectName + str(i) + "/v0/sourceCode/runall_gcov.sh",
            mode="w",
        )
        for j in range(0, 8):
            fileList.append(
                open(
                    "./data/"
                    + projectName
                    + str(i)
                    + "/v0/sourceCode"
                    + str(j)
                    + "/runall_gcov.sh",
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
def createTest(threadNum):
    print("第" + str(threadNum) + "个线程已开始")
    nowPath = os.getcwd().replace("\\", "/")
    for i in range(0, 8):
        file_obj = open(
            "./data/"
            + projectName
            + str(i)
            + "/v0/sourceCode"
            + str(threadNum)
            + "/runall_test.sh",
            mode="w+",
        )
        file_obj.write(
            "cd "
            + nowPath
            + "/data/"
            + projectName
            + str(i)
            + "/v0/sourceCode"
            + str(threadNum)
            + "\n"
        )

        file_obj.write("./runall.sh\n")
        file_obj.write("gcov print_tokens.c\n")
        file_obj.write("mv print_tokens.c.gcov ../outputs\n")
        file_obj.write("rm print_tokens.exe\n")
        if i != 0:
            file_obj.write("./runall_gcov.sh\n")
        file_obj.close()
        p = subprocess.Popen(
            [
                "C:/Program Files/Git/git-bash.exe",
                "./data/"
                + projectName
                + str(i)
                + "/v0/sourceCode"
                + str(threadNum)
                + "/runall_test.sh",
            ]
        )
        p.wait()
        print(i)
    print("已完成第" + str(threadNum) + "个线程")


# 获取每一个测试用例的执行次数，以及对错
def getRunTime():
    rightResult = {}
    for i in range(0, 4130):
        file_correct = open(
            "./data/" + projectName + "0/v0/outputs/t" + str(i + 1), "r"
        )
        rightResult[i + 1] = file_correct.read()
    file_correct = open("./data/" + projectName + "0/resultData.json", "w")
    file_correct.write(json.dumps(rightResult))
    for i in range(1, 8):
        result = {}
        resultMatrix = {}
        lineTestMatrix = {}
        timeMatrix = []
        for j in range(0, 8):
            timeMatrix.append([])
        with alive_bar(4130) as bar:
            for j in range(0, 4130):
                nowThread = j % 8
                # 取出相应测试用例的的执行频谱
                file_correct = open(
                    "./data/print_tokens"
                    + str(i)
                    + "/v0/outputs/t"
                    + str(j + 1)
                    + "_print_tokens.c.gcov",
                    mode="r",
                )
                # 将变异版本的测试用例的结果取出
                file_test = open(
                    "./data/" + projectName + str(i) + "/v0/outputs/t" + str(j + 1),
                    mode="r",
                )
                test = file_test.read()
                runTimeNow = 0
                nowTestResult = rightResult[j + 1] == test
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
                result[j + 1] = {"v0": [str(nowTestResult), runTimeNow, test]}
                bar()
        file = open(
            "./data/" + projectName + str(i) + "/runTime.json", mode="w"
        )  # 代码执行次数
        file.write(json.dumps(result))

        resultTestNum = {}
        for j in resultMatrix:
            resultTestNum[j] = {
                "aef": resultMatrix[j].count(3),
                "aep": resultMatrix[j].count(1),
                "anf": resultMatrix[j].count(2),
                "anp": resultMatrix[j].count(0),
            }

        file = open(
            "./data/" + projectName + str(i) + "/v0/allTestDoubt.json", mode="w"
        )  # 结果矩阵
        file.write(json.dumps(resultTestNum))

        file = open(
            "./data/" + projectName + str(i) + "/v0/lineTestCase.json", mode="w"
        )  # 结果矩阵
        file.write(json.dumps(lineTestMatrix))
        file = open(
            "./data/" + projectName + str(i) + "/v0/speMatrix.json", mode="w"
        )  # 结果矩阵
        file.write(json.dumps(resultMatrix))


# 获取代码逻辑内的函数调用关系
def getFuncStatic():
    nowPath = os.getcwd().replace("\\", "/")
    for i in range(0, 8):
        os.system(
            "cd "
            + nowPath
            + "./data/print_tokens"
            + str(i)
            + "/v0/sourceCode/ && gcc print_tokens.c -g -o print_tokens.exe"
        )
        gdbmi = GdbController()
        response = gdbmi.write(
            "file ./data/" + projectName + str(i) + "/v0/sourceCode/print_tokens.exe"
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
        f = open(
            "./data/" + projectName + str(i) + "/v0/outputs/print_tokens.c.gcov", "r"
        )
        codeData = f.read().split("\n")
        nowSourceFile = ""
        nowLevel = 0
        isAnnotation = False
        funcStaicData = {}
        argsLevel = 0
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
            nowLineCode = j.split(":", 2)[2]

            if "{" in nowLineCode:
                nowLevel += 1
            if "}" in nowLineCode:
                nowLevel -= 1

            if nowLevel == 0:
                for k in isFuncName:
                    if k in nowLineCode:
                        nowSourceFile = k
                        funcStaicData[nowSourceFile] = {
                            "file": isFuncName[k][0],
                            "funcType": isFuncName[k][1],
                            "funcArgs": nowLineCode.split("(")[1]
                            .split(")")[0]
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
        f = open("./data/" + projectName + str(i) + "/v0/funcInvokeStatic.json", "w")
        f.write(json.dumps(funcStaicData))


def getCodeBranch():
    """
    gcc -fdump-tree-cfg-lineno print_tokens.c -o print_tokens 获取程序的cfg图
    """

    nowPath = os.getcwd().replace("\\", "/")
    for i in range(1, 8):
        file_obj = open(
            "./data/" + projectName + str(i) + "/v0/sourceCode/runcfg.sh",
            mode="w",
        )
        file_obj.write(
            "cd " + nowPath + "/data/" + projectName + str(i) + "/v0/sourceCode\n"
        )
        file_obj.write("gcc -fdump-tree-cfg-lineno print_tokens.c -o print_tokens\n")
        file_obj.close()
        p = subprocess.Popen(
            [
                "C:/Program Files/Git/git-bash.exe",
                "./data/" + projectName + str(i) + "/v0/sourceCode/runcfg.sh",
            ]
        )
        p.wait()
        cfgFile = open(
            "./data/" + projectName + str(i) + "/v0/sourceCode/print_tokens.c.011t.cfg",
            "r",
        )
        cfgData = cfgFile.readlines()
        f = open("./data/" + projectName + str(i) + "/v0/funcInvokeStatic.json", "r")
        funcData = json.load(f)
        f.close()
        funCFG = {}
        for j in funcData:
            funCFG[j] = {"node": {}, "link": []}
        nowFunc = ""
        isStart = False
        nowNode = ""
        for j in cfgData:
            if j.startswith(";;"):
                continue
            j = j.strip()
            if "(" in j and ")" in j:
                lineFunc = j.split(" ", 1)
                if lineFunc[0] in funCFG:
                    nowFunc = lineFunc[0]
                    continue
            if nowFunc != "" and j == "{":
                isStart = True
                continue
            if isStart:
                if j.startswith("[0:0]"):
                    continue
                if j.startswith("<"):
                    nowNode = j.split(">")[0].replace("<", "")
                    if nowNode not in funCFG[nowFunc]["node"]:
                        funCFG[nowFunc]["node"][nowNode] = []
                else:
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
                        jSplitLine = j.split("[print_tokens.c:")
                        for k in jSplitLine:
                            if k == "":
                                continue
                            k = k.split(":")[0]
                            funCFG[nowFunc]["node"][nowNode].append(k)

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
        branchSkip = []
        for j in funCFG:
            for k in funCFG[j]["link"]:
                branchSkip.append(
                    [
                        funCFG[j]["node"][k[0]][-1],
                        funCFG[j]["node"][k[1]][0],
                        k[0],
                        k[1],
                        j,
                    ]
                )
        f = open("./data/" + projectName + str(i) + "/v0/funCFG.json", "w")
        f.write(json.dumps(funCFG))
        f = open("./data/" + projectName + str(i) + "/v0/branchSkip.json", "w")
        f.write(json.dumps(branchSkip))


# 获取代码修改
def getDiffFromVersion():
    file_1 = open("./data/" + projectName + "0/v0/sourceCode/print_tokens.c", "r")
    a = file_1.read().splitlines()
    for i in range(1, 8):
        file_2 = open(
            "./data/" + projectName + str(i) + "/v0/sourceCode/print_tokens.c", "r"
        )
        # 按行分割文件,返回的是列表
        b = file_2.read().splitlines()
        # difflib库显示逐行差异，a文件的第一行跟b文件的第一行去比较
        # 使用Python的Diff-HTML进行比较。并生成HTML文件
        d = difflib.HtmlDiff()
        htmlContent = d.make_file(a, b)

        with open(
            "./data/print_tokens0/v0/" + str(i) + "diff.html", "w+", encoding="utf-8"
        ) as f:  # 写成html文件
            f.write(htmlContent)

        # 关闭文件
        file_1.close()
        file_2.close()


if __name__ == "__main__":

    # 对项目目录结构进行重构
    # changeFileItem()
    # 获取项目的源代码
    # getSourceCode()

    # 为8个版本分别创建测试用例
    # buff = []
    # file_name = "./data/" + projectName + "/scripts/runall.sh"
    # # 打开原来的runall.ps1文件，并把所有语句进行记录保存
    # inputData = {}
    # with open(file_name) as file_obj:
    #     for content in file_obj:
    #         if "print_tokens.exe" in content:
    #             content = content.replace("../source/", "./")
    #             content = content.replace(
    #                 "../inputs/", "../../../" + projectName + "/inputs/"
    #             )
    #         buff.append(content)
    """cd
    创建测试用例的相关脚本 echo ">>>>>>>>running test 1"
    ./print_tokens.exe  < ../../../inputs/newtst148.tst > ../../../outputs/v0/t1
    """
    # createV(buff)
    """
      创建获取执行过程的相关脚本
      echo ">>>>>>>>running test 1"
      gcc -fprofile-arcs -ftest-coverage print_tokens.c -o print_tokens.exe
      ./print_tokens.exe  < ../../../inputs/newtst148.tst > ../../../outputs/v0/t1
      gcov print_tokens.c
      cp print_tokens.c.gcov ../../../outputs/v0/t1_print_tokens.c.gcov
      rm print_tokens.exe
    # """
    # createAllV(buff)
    """
      gcc -fprofile-arcs -ftest-coverage print_tokens.c -o print_tokens.exe
      ./runall.sh
      gcov print_tokens.c
      mv print_tokens.c.gcov ../../../outputs/v0
      rm print_tokens.exe
    """
    # allThread = []
    # for i in range(0, 8):
    #     allThread.append(Thread(target=createTest, args=(i,)))

    # for i in range(0, 8):
    #     allThread[i].start()
    # for i in range(0, 8):
    #     allThread[i].join()
    # print("所有线程已完成")
    # for i in range(0, 8):
    #     for j in range(0, 8):
    #         shutil.rmtree("./data/" + projectName + str(i) + "/v0/sourceCode" + str(j))
    """
    "0": [
    "right",
    351,
    "error,\t\"\".\nidentifier,\t\"J0Bey\".\ncomma.\neof.\n"
    ],
    """
    getRunTime()
    # getFuncStatic()
    # getCodeBranch()
    # getDiffFromVersion()
