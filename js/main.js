// 主应用逻辑
class RollCallerApp {
    constructor() {
        this.students = [];
        this.currentStudent = null;
        this.isAnimating = false;
    }

    // 初始化���用
    async init() {
        try {
            await storage.init();
            await this.loadStudents();
            await this.loadRecentRecords();
            this.setupEventListeners();
        } catch (error) {
            console.error('初始化失败:', error);
            alert('应用初始化失败，请刷新页面重试');
        }
    }

    // 加载学生列表
    async loadStudents() {
        this.students = await storage.getAllStudents();
        this.updateStudentsTable();
        this.updateStudentCount();
        earthAnimation.initNames(this.students);
    }

    // 更新学生表格
    updateStudentsTable() {
        const tbody = document.getElementById('studentsBody');

        if (this.students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-message">��无学生，请导入名单</td></tr>';
            return;
        }

        tbody.innerHTML = this.students.map(student => `
            <tr>
                <td>${this.escapeHtml(student.name)}</td>
                <td>${student.weight}</td>
                <td><span class="status-badge status-${student.status}">${this.getStatusText(student.status)}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="app.resetStudentWeight('${student.id}')">重置权重</button>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteStudent('${student.id}')">删除</button>
                </td>
            </tr>
        `).join('');
    }

    // 更新学生计数
    updateStudentCount() {
        document.getElementById('studentCount').textContent = `(${this.students.length})`;
    }

    // 加载最近记录
    async loadRecentRecords() {
        const records = await storage.getRecentRecords(50);
        this.updateRecordsTable(records);
    }

    // 更新记录表格
    updateRecordsTable(records) {
        const tbody = document.getElementById('recordsBody');

        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-message">暂无记录</td></tr>';
            return;
        }

        tbody.innerHTML = records.map(record => {
            const date = new Date(record.timestamp);
            const timeStr = date.toLocaleString('zh-CN');

            return `
                <tr>
                    <td>${timeStr}</td>
                    <td>${this.escapeHtml(record.studentName)}</td>
                    <td><span class="status-badge status-${record.status}">${this.getStatusText(record.status)}</span></td>
                    <td>${this.escapeHtml(record.note || '-')}</td>
                </tr>
            `;
        }).join('');
    }

    // 权重随机选择算法
    selectStudent() {
        if (this.students.length === 0) {
            notify.warning('请先导入学生名单');
            return null;
        }

        // 计算总权重
        const totalWeight = this.students.reduce((sum, student) => sum + student.weight, 1);

        // 生成随机数
        let random = Math.random() * totalWeight;

        // 选择学生
        for (const student of this.students) {
            random -= student.weight;
            if (random <= 0) {
                return student;
            }
        }

        // 兜底返回最后一个学生
        return this.students[this.students.length - 1];
    }

    // 开始点名
    async startDraw() {
        if (this.isAnimating) return;
        if (this.students.length === 0) {
            notify.warning('请先导入学生名单');
            return;
        }

        this.isAnimating = true;
        const drawBtn = document.getElementById('drawBtn');
        drawBtn.disabled = true;
        drawBtn.textContent = '正在抽取...';

        // 清空当前显示
        document.getElementById('studentName').textContent = '-';
        document.getElementById('attendanceSection').style.display = 'none';

        // 开始动画
        earthAnimation.startRolling();

        // 2秒后停止并选择学生
        setTimeout(async () => {
            this.currentStudent = this.selectStudent();

            // 停止动画
            await earthAnimation.stopRolling(this.currentStudent.id);

            // 显示选中的学生
            document.getElementById('studentName').textContent = this.currentStudent.name;
            document.getElementById('attendanceSection').style.display = 'block';

            drawBtn.disabled = false;
            drawBtn.textContent = '开始点名';
            this.isAnimating = false;
        }, 2000);
    }

    // 确认签到记录
    async confirmAttendance(status, note) {
        if (!this.currentStudent) return;

        const record = {
            id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            studentId: this.currentStudent.id,
            studentName: this.currentStudent.name,
            type: 'draw',
            status: status,
            note: note,
            timestamp: Date.now()
        };

        // 保存记录
        await storage.addRecord(record);

        // 如果是迟到，增加权重
        if (status === 'late') {
            await storage.updateStudentWeight(this.currentStudent.id, 2);
            await this.loadStudents(); // 重新加载学生列表
        } else if (status === 'present') {
            // 出席后重置权重为1
            await storage.updateStudentWeight(this.currentStudent.id, 1);
            await this.loadStudents();
        }

        // 刷新记录列表
        await this.loadRecentRecords();

        // 隐藏签到区域
        document.getElementById('attendanceSection').style.display = 'none';
        document.getElementById('note').value = '';
        document.getElementById('studentName').textContent = '-';

        this.currentStudent = null;

        notify.success('签到记录已保存');
    }

    // 重置学生权重
    async resetStudentWeight(id) {
        await storage.updateStudentWeight(id, 1);
        await this.loadStudents();
    }

    // 删除学生
    async deleteStudent(id) {
        const confirmed = await notify.confirmDelete('确定要删除这个学生吗？此操作无法撤销。');
        if (confirmed) {
            await storage.deleteStudent(id);
            await this.loadStudents();
            notify.success('学生已删除');
        }
    }

    // 按日期筛选记录
    async filterRecordsByDate() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');

        let startDate = null;
        let endDate = null;

        if (startDateInput.value) {
            startDate = new Date(startDateInput.value);
            startDate.setHours(0, 0, 0, 0);
        }

        if (endDateInput.value) {
            endDate = new Date(endDateInput.value);
            endDate.setHours(23, 59, 59, 999);
        }

        const records = await storage.getRecordsByDateRange(startDate, endDate);
        this.updateRecordsTable(records);
    }

    // 导出筛选结果
    async exportFilteredRecords() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');

        let startDate = null;
        let endDate = null;

        if (startDateInput.value) {
            startDate = new Date(startDateInput.value);
            startDate.setHours(0, 0, 0, 0);
        }

        if (endDateInput.value) {
            endDate = new Date(endDateInput.value);
            endDate.setHours(23, 59, 59, 999);
        }

        await exportManager.exportRecords(startDate, endDate);
    }

    // 设置事件监听
    setupEventListeners() {
        // 点名按钮
        document.getElementById('drawBtn').addEventListener('click', () => {
            this.startDraw();
        });

        // 签到状态按钮
        const attendanceButtons = document.querySelectorAll('.attendance-buttons .btn');
        attendanceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const status = btn.dataset.status;
                const note = document.getElementById('note').value;
                this.confirmAttendance(status, note);
            });
        });

        // 确认记录按钮
        document.getElementById('confirmBtn').addEventListener('click', () => {
            const status = 'present'; // 默认为出席
            const note = document.getElementById('note').value;
            this.confirmAttendance(status, note);
        });

        // 筛选按钮
        document.getElementById('filterBtn').addEventListener('click', () => {
            this.filterRecordsByDate();
        });

        // 导出筛选结果按钮
        document.getElementById('exportFilteredBtn').addEventListener('click', () => {
            this.exportFilteredRecords();
        });
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'present': '出席',
            'late': '迟到',
            'absent': '缺席',
            'normal': '正常'
        };
        return statusMap[status] || status;
    }
}

// 创建全局应用实例
const app = new RollCallerApp();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 全局函数：供HTML中的onclick调用
window.app = app;
window.loadStudents = () => app.loadStudents();
