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
            await storage.addStudents(this.pendingStudents);
            this.pendingStudents = [];
            return true;
        } catch (error) {
            console.error('导入失败:', error);
            return false;
        }
    }

    // 取消导入
    cancelImport() {
        this.pendingStudents = [];
    }
}

// 创建全局导入管理器实例
const importManager = new ImportManager();

// 设置导入相关的事件监听
document.addEventListener('DOMContentLoaded', () => {
    const importBtn = document.getElementById('importBtn');
    const csvInput = document.getElementById('csvInput');
    const importModal = document.getElementById('importModal');
    const closeModal = document.getElementById('closeModal');
    const cancelImport = document.getElementById('cancelImport');
    const confirmImport = document.getElementById('confirmImport');

    // 点击导入按钮
    importBtn.addEventListener('click', () => {
        csvInput.click();
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
                alert('未找到有效的学生数据，请检查CSV文件格式');
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
        const success = await importManager.confirmImport();
        if (success) {
            alert(`成功导入 ${importManager.pendingStudents.length} 名学生`);
            importModal.style.display = 'none';
            // 刷新学生列表
            if (typeof loadStudents === 'function') {
                loadStudents();
            }
        } else {
            alert('导入失败，请重试');
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
