// CSV 导出功能
class ExportManager {
    // 将记录转换为CSV格式
    recordsToCSV(records) {
        if (records.length === 0) return '';

        // CSV 头部（添加BOM以支持中文）
        let csv = '\uFEFF';
        csv += '时间,学生姓名,类型,状态,备注\n';

        // CSV 数据
        records.forEach(record => {
            const date = new Date(record.timestamp);
            const timeStr = date.toLocaleString('zh-CN');
            const note = record.note || '-';

            // 处理可能包含逗号的字段
            const escape = (str) => {
                if (str && str.includes(',')) {
                    return `"${str}"`;
                }
                return str || '';
            };

            csv += `${escape(timeStr)},${escape(record.studentName)},${escape(record.type)},${escape(record.status)},${escape(note)}\n`;
        });

        return csv;
    }

    // 下载CSV文件
    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 导出记录
    async exportRecords(startDate, endDate) {
        try {
            let records;

            if (startDate && endDate) {
                records = await storage.getRecordsByDateRange(startDate, endDate);
            } else {
                records = await storage.getAllRecords();
            }

            if (records.length === 0) {
                notify.warning('没有记录可以导出');
                return false;
            }

            // 按时间排序
            records.sort((a, b) => a.timestamp - b.timestamp);

            const csv = this.recordsToCSV(records);

            // 生成文件名
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const filename = `签到记录_${dateStr}.csv`;

            this.downloadCSV(csv, filename);
            notify.success('导出成功');
            return true;
        } catch (error) {
            console.error('导出失败:', error);
            notify.error('导出失败，请重试');
            return false;
        }
    }
}

// 创建全局导出管理器实例
const exportManager = new ExportManager();

// 设置导出相关的事件监听
document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('exportBtn');
    const exportModal = document.getElementById('exportModal');
    const closeExportModal = document.getElementById('closeExportModal');
    const cancelExport = document.getElementById('cancelExport');
    const confirmExport = document.getElementById('confirmExport');
    const exportStartDate = document.getElementById('exportStartDate');
    const exportEndDate = document.getElementById('exportEndDate');

    // 设置默认日期（最近30天）
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    exportEndDate.value = today.toISOString().split('T')[0];
    exportStartDate.value = thirtyDaysAgo.toISOString().split('T')[0];

    // 点击导出按钮
    exportBtn.addEventListener('click', () => {
        exportModal.style.display = 'flex';
    });

    // 关闭模态框
    closeExportModal.addEventListener('click', () => {
        exportModal.style.display = 'none';
    });

    // 取消导出
    cancelExport.addEventListener('click', () => {
        exportModal.style.display = 'none';
    });

    // 确认导出
    confirmExport.addEventListener('click', async () => {
        const startDate = exportStartDate.value ? new Date(exportStartDate.value) : null;
        const endDate = exportEndDate.value ? new Date(exportEndDate.value) : null;

        // 设置结束时间为当天的23:59:59
        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
        }

        // 设置开始时间为当天的00:00:00
        if (startDate) {
            startDate.setHours(0, 0, 0, 0);
        }

        const success = await exportManager.exportRecords(startDate, endDate);
        if (success) {
            exportModal.style.display = 'none';
        }
    });

    // 点击模态框外部关闭
    exportModal.addEventListener('click', (event) => {
        if (event.target === exportModal) {
            exportModal.style.display = 'none';
        }
    });
});
