from copy import deepcopy
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from lxml import etree


BASE = Path(r"D:\实习工作\掌眼")
TEMPLATE_DIR = BASE / "周报" / "模板"
OUTPUT_DIR = BASE / "周报" / "第三周"

SUMMARY_TEMPLATE = TEMPLATE_DIR / "工作总结模板.docx"
WEEKLY_TEMPLATE = TEMPLATE_DIR / "xxx（姓名）第x周工作周报(5)(1).docx"

SUMMARY_OUTPUT = OUTPUT_DIR / "李晟豪_第三周工作总结报告_掌眼项目.docx"
WEEKLY_OUTPUT = OUTPUT_DIR / "李晟豪_第三周工作周报_掌眼项目.docx"

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}


SUMMARY_TASK = (
    "梳理首案数值、测试与结算问题，在不扩写第二案件的前提下完成一版整洁、可演示的高保真H5界面；"
    "验证手机、桌面核心流程，并提出判断质量评分修正方案。"
)

WEEK1_TASK = (
    "老师要求我们自行策划一款微信端H5小游戏，题材围绕古董、古玩展开，画面风格需相对中性，并完成玩法与视觉方向的前期探索。"
)

WEEK1_COMPLETION = (
    "本周团队经过讨论，确定游戏名称为《掌眼》，并初步搭建“观察古玩—判断真伪—交易收藏”的核心循环，规划了鉴定、收藏、经营成长及系统活动等内容。"
    "视觉方面，我们比较了像素风、写实风和半写实风格化等方案。主要困难是古玩题材容易显得厚重、偏男性化，而鉴定玩法又需要保留足够的物件细节。"
    "经过测试，我们初步倾向于中性、清晰的半写实风格化方向，通过材质、轮廓和局部特写突出鉴定信息。"
    "本周让我认识到，H5项目必须先确定核心体验并控制体量，视觉方案也应服务于实际交互，后续应尽快制作原型进行验证。"
)

WEEK2_TASK = (
    "在第一周策划基础上，细化《掌眼》的调查、对话、交易与结算流程，制作可运行的低保真H5原型；"
    "建立可复现的规则和数值实验，验证NPC状态、信息披露、定价与风险控制。"
)

WEEK2_COMPLETION = (
    "本周梳理了项目启动资料和系统边界，在根目录建立Git版本管理，完成React版与可直接打开的单文件HTML低保真原型。"
    "围绕“接案—调查/询问—交易—复盘”完善证据簿、行动预算、NPC压力/信任/成交意愿/控制感、多轮回应、报价及局末评价，并将玩家界面与开发调试信息分开。"
    "迭代中发现线性流程容易造成行动点耗尽和死局，固定回应也无法体现连续交涉，因此改为调查与询问可交叉进行、交易和结束始终可达，NPC状态依据历史持续变化。"
    "数值方面建立批量实验台，用厚尾价值、玩家/NPC双后验、Q20保守参考价、检测成本和不同人物参数比较策略，发现极端错价频率偏高这一待调问题。"
    "本周的主要收获是：游戏平衡不能只依靠单一“能力值”，而要先分清独立账本和关键耦合点，再通过模拟、回归测试与试玩逐步校准。"
)

SUMMARY_COMPLETION = (
    "本周先复盘低保真原型和数值实验台，发现旧“客观分”会把真实价值65、成交65错误评为满分，以及一条强证据也可能获得判断质量SSS。"
    "为降低理解负担，将净收益、议价表现、判断质量分开，调查行动点和议价容量分离，具体证据公开替代抽象披露，并把回归测试能证明和不能证明的边界整理成文档。"
    "随后完成独立的《掌眼_高保真教师演示.html》，以当代雅集式鉴定工作台呈现二维器物插画和文字证据，打通观察、收证、询问、证据公开、重估、报价、交易与多维复盘。"
    "完成58项自动测试，并在1440×1000、390×844及纯键盘流程中复核；修正NPC还价后终局按钮被裁切问题。"
    "围绕评分过高又完成修正规格和实施计划，明确普通单条强证据最高S、局部锚点最高SS、只有整案决定性证据可单独获得SSS。"
    "本周末老师提出封存当前高保真版本，并将下一版方向调整为更自动化、低认知门槛和低上手难度，因此后续先固定本版基线，再围绕自动化流程和减负体验迭代。"
    "主要收获是：自动测试不能替代平衡性和可理解性试玩；数值预算应拆分账本，阶段版本也要及时封存，才能清楚比较后续改动。"
)

WEEKLY_FIELDS = {
    (3, 2): "梳理《掌眼》首案的数值、测试与结算问题；完成独立高保真教师演示H5；验证桌面、手机和键盘流程；设计判断质量评分修正方案。",
    (4, 2): (
        "完成数值系统和回归测试边界梳理，将净收益、议价表现、判断质量分开，并分离调查点与议价容量。"
        "新增独立《掌眼_高保真教师演示.html》，保留低保真原型与实验台，打通观察、取证、询问、证据公开、重估、议价、交易和复盘。"
        "58项自动测试通过，并在1440×1000、390×844及纯键盘流程中复核；修正还价后终局按钮被裁切问题。"
        "另完成判断质量修正规格和实施计划。"
        "本周末老师要求封存当前版本，并将下一版调整为更自动化、低认知门槛和低上手难度。"
    ),
    (5, 2): (
        "旧客观分会把无利润成交误判为满分，单条强证据也可能获得SSS；因此拆分结果维度，为判断质量加入决策合理性、后验确定性、证据稳健度和证据等级上限。"
        "还价后页面内容增长会裁切终局按钮，改为最小幅度自动滚动。"
        "针对数值多、测试全绿易被误读为已平衡的问题，用渐进式文档说明测试边界，并将真人理解和参数平衡列为待验证项。"
    ),
    (6, 2): (
        "需与老师进一步确认“更自动化、低认知门槛、低上手难度”的具体边界：哪些步骤可由系统代办，哪些判断必须保留给玩家，以及下一版的验收标准。"
    ),
    (7, 2): (
        "先封存当前高保真版本，整理版本文件、验证记录和变更说明；下一版以更自动化、低认知门槛和低上手难度为目标，"
        "优先减少手动步骤、数值暴露和规则学习成本，同时保留古玩鉴定与交易判断的核心反馈；暂不扩写第二案件。"
    ),
    (8, 2): "8月3日完成版本封存和记录；8月4—6日梳理自动化与降难度方案，确定最小改版范围；8月7—9日完成首轮交互改版与回归检查。",
    (9, 2): (
        "自动化过强可能削弱玩家判断和交易博弈，难度降低也可能使流程退化为自动演示；"
        "需要在减少操作与保留核心决策之间取得平衡，并避免改版破坏当前封存基线。"
    ),
    (10, 1): (
        "本周认识到，高保真不只是视觉精修，还要让规则边界、操作入口和结果反馈保持一致。"
        "自动测试可以证明流程和既定规则没有回退，却不能证明数值平衡、玩家理解或游戏乐趣；"
        "因此要结合渐进式说明、固定案例、模拟和真人试玩共同校准。"
        "阶段版本也应及时封存，才能清楚比较下一版“更自动、低认知、低难度”调整带来的真实影响。"
    ),
}


def qn(local: str) -> str:
    return f"{{{W}}}{local}"


def direct_children(parent, local: str):
    return [child for child in parent if child.tag == qn(local)]


def table_rows(root):
    body = root.find("w:body", NS)
    table = next(child for child in body if child.tag == qn("tbl"))
    return direct_children(table, "tr")


def row_cells(row):
    return direct_children(row, "tc")


def first_paragraph(cell):
    return next(child for child in cell if child.tag == qn("p"))


def clone_rpr(paragraph):
    run = paragraph.find("w:r", NS)
    if run is None:
        return None
    rpr = run.find("w:rPr", NS)
    return deepcopy(rpr) if rpr is not None else None


def set_paragraph_text(paragraph, text: str):
    rpr = clone_rpr(paragraph)
    for child in list(paragraph):
        if child.tag != qn("pPr"):
            paragraph.remove(child)
    run = etree.SubElement(paragraph, qn("r"))
    if rpr is not None:
        run.append(rpr)
    node = etree.SubElement(run, qn("t"))
    if text.startswith(" ") or text.endswith(" "):
        node.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    node.text = text


def append_line(paragraph, text: str):
    rpr = clone_rpr(paragraph)
    run = etree.SubElement(paragraph, qn("r"))
    if rpr is not None:
        run.append(rpr)
    etree.SubElement(run, qn("br"))
    node = etree.SubElement(run, qn("t"))
    node.text = text


def rewrite_docx(template: Path, output: Path, editor):
    with ZipFile(template, "r") as source:
        entries = [(info, source.read(info.filename)) for info in source.infolist()]

    xml_index = next(i for i, (info, _) in enumerate(entries) if info.filename == "word/document.xml")
    xml_info, xml_data = entries[xml_index]
    parser = etree.XMLParser(remove_blank_text=False)
    root = etree.fromstring(xml_data, parser)
    editor(root)
    entries[xml_index] = (
        xml_info,
        etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True),
    )

    output.parent.mkdir(parents=True, exist_ok=True)
    temp = output.with_suffix(output.suffix + ".tmp")
    with ZipFile(temp, "w") as target:
        for info, data in entries:
            copied = ZipInfo(info.filename, date_time=info.date_time)
            copied.compress_type = info.compress_type if info.compress_type is not None else ZIP_DEFLATED
            copied.comment = info.comment
            copied.extra = info.extra
            copied.internal_attr = info.internal_attr
            copied.external_attr = info.external_attr
            copied.create_system = info.create_system
            copied.create_version = info.create_version
            copied.extract_version = info.extract_version
            copied.flag_bits = info.flag_bits
            copied.volume = info.volume
            target.writestr(copied, data)
    temp.replace(output)


def edit_summary(root):
    rows = table_rows(root)
    set_paragraph_text(first_paragraph(row_cells(rows[0])[1]), "李晟豪")
    set_paragraph_text(first_paragraph(row_cells(rows[0])[3]), "《掌眼》微信端H5小游戏 / 游戏策划实习生")
    set_paragraph_text(first_paragraph(row_cells(rows[1])[0]), "项目起止时间:2026年7月14日起")

    week_cell = row_cells(rows[3])[0]
    paragraphs = direct_children(week_cell, "p")
    assert "第一周" in "".join(paragraphs[1].itertext())
    assert "布置任务" in "".join(paragraphs[2].itertext())
    assert "完成情况" in "".join(paragraphs[3].itertext())
    append_line(paragraphs[2], WEEK1_TASK)
    append_line(paragraphs[3], WEEK1_COMPLETION)
    assert "第二周" in "".join(paragraphs[6].itertext())
    assert "布置任务" in "".join(paragraphs[7].itertext())
    assert "完成情况" in "".join(paragraphs[8].itertext())
    append_line(paragraphs[7], WEEK2_TASK)
    append_line(paragraphs[8], WEEK2_COMPLETION)
    assert "第三周" in "".join(paragraphs[11].itertext())
    assert "布置任务" in "".join(paragraphs[12].itertext())
    assert "完成情况" in "".join(paragraphs[13].itertext())
    append_line(paragraphs[12], SUMMARY_TASK)
    append_line(paragraphs[13], SUMMARY_COMPLETION)


def edit_weekly(root):
    rows = table_rows(root)
    set_paragraph_text(first_paragraph(row_cells(rows[1])[0]), "姓名：李晟豪")
    set_paragraph_text(first_paragraph(row_cells(rows[1])[1]), "岗位名称：游戏策划实习生")
    set_paragraph_text(first_paragraph(row_cells(rows[2])[0]), "提交日期：2026年8月2日")
    for (row_index, cell_index), value in WEEKLY_FIELDS.items():
        set_paragraph_text(first_paragraph(row_cells(rows[row_index])[cell_index]), value)


def main():
    rewrite_docx(SUMMARY_TEMPLATE, SUMMARY_OUTPUT, edit_summary)
    rewrite_docx(WEEKLY_TEMPLATE, WEEKLY_OUTPUT, edit_weekly)
    print(SUMMARY_OUTPUT)
    print(WEEKLY_OUTPUT)


if __name__ == "__main__":
    main()
