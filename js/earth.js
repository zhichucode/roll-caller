// 3D地球动画控制
class EarthAnimation {
    constructor() {
        this.earth = document.getElementById('earth');
        this.namesContainer = document.getElementById('namesContainer');
        this.isRolling = false;
        this.currentStudents = [];
    }

    // 初始化地球上的名字
    initNames(students) {
        this.currentStudents = students;
        this.namesContainer.innerHTML = '';

        if (students.length === 0) return;

        // 计算每个名字的位置（均匀分布在球面上）
        const count = students.length;
        const phiStep = Math.PI * 2 / count;

        students.forEach((student, index) => {
            const nameEl = document.createElement('div');
            nameEl.className = 'name-item';
            nameEl.textContent = student.name;
            nameEl.dataset.studentId = student.id;

            // 使用斐波那契球面分布算法
            const y = 1 - (index / (count - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = phiStep * index;

            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;

            // 将3D坐标转换为CSS变换
            const distance = 180; // 距离球心的距离
            const transform = `translate3d(${x * distance}px, ${y * distance}px, ${z * distance}px)`;
            nameEl.style.transform = transform;

            this.namesContainer.appendChild(nameEl);
        });
    }

    // 开始旋转
    startRolling() {
        this.isRolling = true;
        this.earth.classList.add('rolling');
        this.earth.classList.remove('stopped');
    }

    // 停止旋转并选中学生
    async stopRolling(selectedStudentId) {
        return new Promise((resolve) => {
            this.isRolling = false;
            this.earth.classList.remove('rolling');
            this.earth.classList.add('stopped');

            // 找到选中的名字元素
            const nameElements = this.namesContainer.querySelectorAll('.name-item');
            let selectedElement = null;

            nameElements.forEach(el => {
                if (el.dataset.studentId === selectedStudentId) {
                    selectedElement = el;
                    el.classList.add('highlighted');
                } else {
                    el.classList.remove('highlighted');
                }
            });

            // 地球选中动画
            setTimeout(() => {
                this.earth.classList.add('selected');
            }, 100);

            // 2秒后恢复
            setTimeout(() => {
                this.earth.classList.remove('selected');
                if (selectedElement) {
                    selectedElement.classList.remove('highlighted');
                }
                this.earth.classList.remove('stopped');
                resolve();
            }, 2000);
        });
    }

    // 更新名字列表
    updateNames(students) {
        this.initNames(students);
    }
}

// 创建全局地球动画实例
const earthAnimation = new EarthAnimation();
