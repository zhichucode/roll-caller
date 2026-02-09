// CSV 导入功能
class ImportManager {
    constructor() {
        this.pendingStudents = [];
    }

    // 解析CSV文件
    parseCSV(text) {
        const lines = text.split(/\r\n|\n/);
        const students = [];
        const seen = new Set();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 跳过空行
            if (!line) continue;

            // 解析行（支持逗号分隔）
            const columns = line.split(',').map(col => col.trim());

            // 跳过标题行（如果包含"姓名"或"name"）
            if (i === 0 && (columns.some(col => /姓名|name/i.test(col)))) {
                continue;
            }

            // 提取姓名
            let name = '';

            // 如果有多列，尝试找姓名列
            if (columns.length > 1) {
                // 假设第二列是姓名
                name = columns[1];
            } else {
                // 单列，直接作为姓名
                name = columns[0];
            }

            // 验证姓名
            if (name && !seen.has(name)) {
                seen.add(name);
                students.push({
                    id: this.generateId(),
                    name: name,
                    weight: 1,
                    status: 'normal',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }
        }

        return students;
    }

    // 生成唯一ID
    generateId() {
        return `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 显示导入预览
    showPreview(students) {
        this.pendingStudents = students;
        const modal = document.getElementById('importModal');
        const count = document.getElementById('importCount');
        const preview = document.getElementById('importPreview');

        count.textContent = students.length;

        // 显示前20个学生作为预览
        const previewHTML = students.slice(0, 20).map(student => `
            <div class="import-preview-item">
                ${student.name}
            </div>
        `).join('');

        preview.innerHTML = previewHTML + (students.length > 20 ? `<p style="text-align: center; color: #666; margin-top: 10px;">... 还有 ${students.length - 20} 名学生</p>` : '');

        modal.style.display = 'flex';
    }

    // 确认导入
    async confirmImport() {
        try {
            const count = this.pendingStudents.length;
            await storage.addStudents(this.pendingStudents);
            this.pendingStudents = [];
            return count;
        } catch (error) {
            console.error('导入失败:', error);
            return false;
        }
    }

    // 取消导入
    cancelImport() {
        this.pendingStudents = [];
    }

    // 导入默认名单
    async importDefaultList() {
        try {
            // 尝试使用fetch加载CSV文件
            let response, text;

            // 尝试多个可能的路径
            const paths = [
                'generated_00hou_100.csv',
                './generated_00hou_100.csv',
                '../generated_00hou_100.csv'
            ];

            for (const path of paths) {
                try {
                    response = await fetch(path);
                    if (response.ok) {
                        text = await response.text();
                        break;
                    }
                } catch (e) {
                    // 继续尝试下一个路径
                    continue;
                }
            }

            // 如果所有路径都失败，使用内嵌的默认数据
            if (!text || !response || !response.ok) {
                console.warn('无法加载CSV文件，使用内嵌默认数据');
                text = this.getDefaultCSVData();
            }

            const students = this.parseCSV(text);

            if (students.length === 0) {
                notify.error('默认名单文件为空或格式错误');
                return false;
            }

            this.showPreview(students);
            return true;
        } catch (error) {
            console.error('导入默认名单失败:', error);
            notify.error('导入默认名单失败，请检查文件是否存在');
            return false;
        }
    }

    // 获取默认CSV数据（内嵌备用数据）
    getDefaultCSVData() {
        return `王佳怡
李俊杰
张梓涵
刘子豪
陈思源
杨欣怡
赵明轩
黄子轩
周雨辰
吴梓萱
徐亦凡
孙诗涵
胡昊然
朱馨予
高嘉豪
林梓睿
何嘉怡
郭宇翔
马文轩
罗思彤
郑博文
王皓轩
李雅婷
张俊杰
陈思涵
杨雨泽
赵欣怡
黄嘉懿
周子轩
吴宇萱
徐浩宇
孙雨桐
胡梓萱
朱嘉豪
高子轩
林思源
何宇轩
郭佳怡
马梓轩
罗昊天
郑博文
王雅萱
李皓轩
张雨泽
刘子萱
陈嘉懿
杨浩然
赵梓萱
黄子轩
周思源
吴佳怡
徐梓轩
孙雅萱
胡博文
朱皓轩
高雨萱
林子轩
何思涵
郭嘉豪
马梓萱
罗宇轩
郑雅婷
王浩宇
李梓萱
张佳怡
刘昊然
陈子轩
杨雨萱
赵博文
黄梓萱
周浩宇
吴思源
徐佳怡
孙皓轩
胡雨萱
朱子轩
高博文
林雅萱
何梓轩
郭浩然
马思源
罗佳怡
郑梓萱
王子轩
李雨萱
张皓轩
刘博文
陈梓萱
杨佳轩
赵昊然
黄雅婷
周子轩
吴梓轩
徐浩然
孙思萱
胡佳怡`;
    }
}

// 创建全局导入管理器实例
const importManager = new ImportManager();

// 设置导入相关的事件监听
document.addEventListener('DOMContentLoaded', () => {
    const importBtn = document.getElementById('importBtn');
    const importDefaultBtn = document.getElementById('importDefaultBtn');
    const csvInput = document.getElementById('csvInput');
    const importModal = document.getElementById('importModal');
    const closeModal = document.getElementById('closeModal');
    const cancelImport = document.getElementById('cancelImport');
    const confirmImport = document.getElementById('confirmImport');

    // 点击导入按钮
    importBtn.addEventListener('click', () => {
        csvInput.click();
    });

    // 点击导入默认名单按钮
    importDefaultBtn.addEventListener('click', () => {
        importManager.importDefaultList();
    });

    // 文件选择
    csvInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const students = importManager.parseCSV(text);

            if (students.length === 0) {
                notify.error('未找到有效的学生数据，请检查CSV文件格式');
                return;
            }

            importManager.showPreview(students);
        };
        reader.readAsText(file);

        // 清空input，允许重复选择同一文件
        csvInput.value = '';
    });

    // 关闭模态框
    closeModal.addEventListener('click', () => {
        importModal.style.display = 'none';
        importManager.cancelImport();
    });

    // 取消导入
    cancelImport.addEventListener('click', () => {
        importModal.style.display = 'none';
        importManager.cancelImport();
    });

    // 确认导入
    confirmImport.addEventListener('click', async () => {
        const count = await importManager.confirmImport();
        if (count !== false) {
            notify.success(`成功导入 ${count} 名学生`);
            importModal.style.display = 'none';
            // 刷新学生列表
            if (typeof loadStudents === 'function') {
                loadStudents();
            }
        } else {
            notify.error('导入失败，请重试');
        }
    });

    // 点击模态框外部关闭
    importModal.addEventListener('click', (event) => {
        if (event.target === importModal) {
            importModal.style.display = 'none';
            importManager.cancelImport();
        }
    });
});
