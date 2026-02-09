// 通知系统
class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // 创建toast容器
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    // 显示toast通知
    show(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 3000
        } = options;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const titles = {
            success: '成功',
            error: '错误',
            warning: '警告',
            info: '提示'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${title || titles[type]}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        this.container.appendChild(toast);

        // 自动移除
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        return toast;
    }

    removeToast(toast) {
        if (toast && toast.parentElement) {
            toast.classList.add('removing');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }

    // 快捷方法
    success(message, title = '') {
        return this.show({ type: 'success', title, message });
    }

    error(message, title = '') {
        return this.show({ type: 'error', title, message });
    }

    warning(message, title = '') {
        return this.show({ type: 'warning', title, message });
    }

    info(message, title = '') {
        return this.show({ type: 'info', title, message });
    }

    // 显示确认对话框
    confirm(options) {
        return new Promise((resolve) => {
            const {
                title = '确认',
                message = '',
                confirmText = '确认',
                cancelText = '取消',
                type = 'warning'
            } = options;

            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';

            const icons = {
                warning: '⚠',
                danger: '✕',
                info: 'ℹ'
            };

            const iconColors = {
                warning: '#f59e0b',
                danger: '#ef4444',
                info: '#3b82f6'
            };

            overlay.innerHTML = `
                <div class="confirm-dialog">
                    <div class="confirm-header">
                        <div class="confirm-icon" style="color: ${iconColors[type] || iconColors.warning}">
                            ${icons[type] || icons.warning}
                        </div>
                        <div class="confirm-title">${title}</div>
                    </div>
                    <div class="confirm-message">${message}</div>
                    <div class="confirm-buttons">
                        <button class="btn btn-secondary cancel-btn">${cancelText}</button>
                        <button class="btn btn-${type === 'danger' ? 'danger' : 'primary'} confirm-btn">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const closeDialog = () => {
                overlay.style.animation = 'fadeOut 0.2s ease-out forwards';
                setTimeout(() => {
                    overlay.remove();
                }, 200);
            };

            overlay.querySelector('.cancel-btn').addEventListener('click', () => {
                closeDialog();
                resolve(false);
            });

            overlay.querySelector('.confirm-btn').addEventListener('click', () => {
                closeDialog();
                resolve(true);
            });

            // 点击外部关闭
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeDialog();
                    resolve(false);
                }
            });
        });
    }

    // 快捷确认方法
    async confirmDelete(message) {
        return await this.confirm({
            title: '确认删除',
            message: message || '确定要删除吗？此操作无法撤销。',
            type: 'danger',
            confirmText: '删除',
            cancelText: '取消'
        });
    }

    async confirmWarning(message) {
        return await this.confirm({
            title: '确认操作',
            message: message,
            type: 'warning',
            confirmText: '确认',
            cancelText: '取消'
        });
    }
}

// 创建全局通知实例
const notify = new NotificationSystem();

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
