// IndexedDB 存储层
const DB_NAME = 'RollCallerDB';
const DB_VERSION = 1;

class Storage {
    constructor() {
        this.db = null;
    }

    // 初始化数据库
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error('无法打开数据库'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建学生表
                if (!db.objectStoreNames.contains('students')) {
                    const studentStore = db.createObjectStore('students', { keyPath: 'id' });
                    studentStore.createIndex('name', 'name', { unique: false });
                    studentStore.createIndex('weight', 'weight', { unique: false });
                    studentStore.createIndex('status', 'status', { unique: false });
                }

                // 创建记录表
                if (!db.objectStoreNames.contains('records')) {
                    const recordStore = db.createObjectStore('records', { keyPath: 'id' });
                    recordStore.createIndex('studentId', 'studentId', { unique: false });
                    recordStore.createIndex('timestamp', 'timestamp', { unique: false });
                    recordStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    // 添加学生
    async addStudent(student) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['students'], 'readwrite');
            const store = transaction.objectStore('students');
            const request = store.add(student);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 批量添加学生
    async addStudents(students) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['students'], 'readwrite');
            const store = transaction.objectStore('students');

            students.forEach(student => {
                store.add(student);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // 获取所有学生
    async getAllStudents() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['students'], 'readonly');
            const store = transaction.objectStore('students');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 获取学生
    async getStudent(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['students'], 'readonly');
            const store = transaction.objectStore('students');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 更新学生
    async updateStudent(student) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['students'], 'readwrite');
            const store = transaction.objectStore('students');
            const request = store.put(student);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 更新学生权重
    async updateStudentWeight(id, weight) {
        const student = await this.getStudent(id);
        if (student) {
            student.weight = weight;
            student.updatedAt = Date.now();
            return await this.updateStudent(student);
        }
    }

    // 删除学生
    async deleteStudent(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['students'], 'readwrite');
            const store = transaction.objectStore('students');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 清空所有学生
    async clearStudents() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['students'], 'readwrite');
            const store = transaction.objectStore('students');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 添加记录
    async addRecord(record) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['records'], 'readwrite');
            const store = transaction.objectStore('records');
            const request = store.add(record);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 获取所有记录
    async getAllRecords() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 按时间范围获取记录
    async getRecordsByDateRange(startDate, endDate) {
        const records = await this.getAllRecords();
        return records.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate >= startDate && recordDate <= endDate;
        });
    }

    // 获取最近N条记录
    async getRecentRecords(limit = 50) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');
            const results = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // 删除记录
    async deleteRecord(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['records'], 'readwrite');
            const store = transaction.objectStore('records');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 清空所有记录
    async clearRecords() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['records'], 'readwrite');
            const store = transaction.objectStore('records');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// 创建全局存储实例
const storage = new Storage();
