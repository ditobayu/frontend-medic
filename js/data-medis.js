// Data Medis Management
class DataMedisManager {
    constructor() {
        this.currentData = [];
        this.editingId = null;
        this.deleteId = null;
        this.crypto = new MedicalDataCrypto(); // Initialize RC5 encryption
        this.init();
    }

    init() {
        // Check authentication
        if (!Auth.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }



        // Set user name
        const user = Auth.getUser();
        if (user && user.name) {
            document.getElementById('welcomeMessage').textContent = `Welcome, ${user.name}!`;
        }

        // Bind events
        this.bindEvents();
        
        // Load initial data
        this.loadData();
    }

    bindEvents() {
        // Navigation
        document.getElementById('logoutBtn').addEventListener('click', this.logout.bind(this));
        
        // Modal controls
        document.getElementById('addDataBtn').addEventListener('click', this.openAddModal.bind(this));
        document.getElementById('closeModal').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('cancelBtn').addEventListener('click', this.closeModal.bind(this));
        
        // Form submission
        document.getElementById('dataForm').addEventListener('submit', this.submitForm.bind(this));
        
        // Search and refresh
        document.getElementById('searchBtn').addEventListener('click', this.searchData.bind(this));
        document.getElementById('refreshBtn').addEventListener('click', this.loadData.bind(this));
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchData();
            }
        });

        // Delete modal
        document.getElementById('cancelDeleteBtn').addEventListener('click', this.closeDeleteModal.bind(this));
        document.getElementById('confirmDeleteBtn').addEventListener('click', this.confirmDelete.bind(this));

        // Close modals when clicking outside
        document.getElementById('dataModal').addEventListener('click', (e) => {
            if (e.target.id === 'dataModal') {
                this.closeModal();
            }
        });

        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.closeDeleteModal();
            }
        });
    }

    async logout() {
        try {
            // Use Auth.post() helper method to ensure token is sent
            await Auth.post(API_ENDPOINTS.LOGOUT, {});
        } catch (error) {
            // Silent error handling for production
        } finally {
            Auth.logout();
            window.location.href = 'index.html';
        }
    }

    async loadData() {
        try {
            this.showLoading();
            
            // Use Auth.get() helper method to ensure token is sent
            const response = await Auth.get(API_ENDPOINTS.DATA_MEDIS);
            
            if (response.ok) {
                const result = await response.json();
                const rawData = result.data || result;
                
                // Decrypt the received data
                this.currentData = this.crypto.decryptDataArray(rawData);
                this.renderTable();
                this.hideMessages();
            } else {
                throw new Error('Failed to load data');
            }
        } catch (error) {
            this.showError('Gagal memuat data medis');
            this.showEmptyState();
        }
    }

    async searchData() {
        const searchTerm = document.getElementById('searchInput').value.trim();
        
        if (!searchTerm) {
            this.loadData();
            return;
        }

        try {
            this.showLoading();
            
            // Filter current data locally for better UX
            const filteredData = this.currentData.filter(item => 
                item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.nomor_riwayat.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.dokter_penanggung_jawab.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            this.renderTable(filteredData);
            
            if (filteredData.length === 0) {
                this.showEmptyState();
            }
        } catch (error) {
            this.showError('Gagal melakukan pencarian');
        }
    }

    openAddModal() {
        this.editingId = null;
        document.getElementById('modalTitle').textContent = 'Tambah Data Medis';
        document.getElementById('submitBtn').textContent = 'Simpan';
        this.resetForm();
        this.showModal();
    }

    openEditModal(id) {
        const data = this.currentData.find(item => item.id === id);
        if (!data) return;

        this.editingId = id;
        document.getElementById('modalTitle').textContent = 'Edit Data Medis';
        document.getElementById('submitBtn').textContent = 'Update';
        this.fillForm(data);
        this.showModal();
    }

    showModal() {
        document.getElementById('dataModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('dataModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.resetForm();
    }

    openDeleteModal(id) {
        this.deleteId = id;
        document.getElementById('deleteModal').classList.remove('hidden');
    }

    closeDeleteModal() {
        this.deleteId = null;
        document.getElementById('deleteModal').classList.add('hidden');
    }

    async submitForm(e) {
        e.preventDefault();
        
        const formData = this.getFormData();
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Menyimpan...';
            
            // Encrypt the form data before sending
            const encryptedFormData = this.crypto.encryptData(formData);
            
            let response;
            if (this.editingId) {
                // Update existing data - Use Auth.put() helper method
                response = await Auth.put(
                    API_ENDPOINTS.DATA_MEDIS_BY_ID(this.editingId),
                    encryptedFormData
                );
            } else {
                // Create new data - Use Auth.post() helper method
                response = await Auth.post(
                    API_ENDPOINTS.DATA_MEDIS,
                    encryptedFormData
                );
            }
            
            if (response.ok) {
                const action = this.editingId ? 'diperbarui' : 'ditambahkan';
                this.showSuccess(`Data medis berhasil ${action}`);
                this.closeModal();
                this.loadData();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menyimpan data');
            }
        } catch (error) {
            this.showError(error.message || 'Gagal menyimpan data medis');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async confirmDelete() {
        if (!this.deleteId) return;
        
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const originalText = confirmBtn.textContent;
        
        try {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Menghapus...';
            
            // Use Auth.delete() helper method to ensure token is sent
            const response = await Auth.delete(
                API_ENDPOINTS.DATA_MEDIS_BY_ID(this.deleteId)
            );
            
            if (response.ok) {
                this.showSuccess('Data medis berhasil dihapus');
                this.closeDeleteModal();
                this.loadData();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menghapus data');
            }
        } catch (error) {
            this.showError(error.message || 'Gagal menghapus data medis');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
        }
    }

    getFormData() {
        return {
            nama: document.getElementById('nama').value.trim(),
            nomor_riwayat: document.getElementById('nomor_riwayat').value.trim(),
            tanggal_lahir: document.getElementById('tanggal_lahir').value,
            jenis_kelamin: document.getElementById('jenis_kelamin').value,
            alamat: document.getElementById('alamat').value.trim(),
            nomor_hp: document.getElementById('nomor_hp').value.trim(),
            keluhan: document.getElementById('keluhan').value.trim(),
            diagnosa: document.getElementById('diagnosa').value.trim(),
            tindakan: document.getElementById('tindakan').value.trim(),
            resep_obat: document.getElementById('resep_obat').value.trim(),
            dokter_penanggung_jawab: document.getElementById('dokter_penanggung_jawab').value.trim(),
            tanggal_periksa: document.getElementById('tanggal_periksa').value
        };
    }

    fillForm(data) {
        document.getElementById('editId').value = data.id;
        document.getElementById('nama').value = data.nama || '';
        document.getElementById('nomor_riwayat').value = data.nomor_riwayat || '';
        document.getElementById('tanggal_lahir').value = data.tanggal_lahir || '';
        document.getElementById('jenis_kelamin').value = data.jenis_kelamin || '';
        document.getElementById('alamat').value = data.alamat || '';
        document.getElementById('nomor_hp').value = data.nomor_hp || '';
        document.getElementById('keluhan').value = data.keluhan || '';
        document.getElementById('diagnosa').value = data.diagnosa || '';
        document.getElementById('tindakan').value = data.tindakan || '';
        document.getElementById('resep_obat').value = data.resep_obat || '';
        document.getElementById('dokter_penanggung_jawab').value = data.dokter_penanggung_jawab || '';
        document.getElementById('tanggal_periksa').value = data.tanggal_periksa || '';
    }

    resetForm() {
        document.getElementById('dataForm').reset();
        document.getElementById('editId').value = '';
    }

    renderTable(data = null) {
        const tableData = data || this.currentData;
        const tbody = document.getElementById('tableBody');
        
        if (tableData.length === 0) {
            this.showEmptyState();
            return;
        }

        tbody.innerHTML = tableData.map(item => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${item.nama}</div>
                    <div class="text-sm text-gray-500">${item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.nomor_riwayat}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${this.formatDate(item.tanggal_periksa)}
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${item.diagnosa}</div>
                    <div class="text-sm text-gray-500">${item.keluhan}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.dokter_penanggung_jawab}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="dataMedisManager.viewDetail(${item.id})" 
                            class="text-indigo-600 hover:text-indigo-900 mr-3">Lihat</button>
                    <button onclick="dataMedisManager.openEditModal(${item.id})" 
                            class="text-yellow-600 hover:text-yellow-900 mr-3">Edit</button>
                    <button onclick="dataMedisManager.openDeleteModal(${item.id})" 
                            class="text-red-600 hover:text-red-900">Hapus</button>
                </td>
            </tr>
        `).join('');

        this.showTable();
    }

    viewDetail(id) {
        const data = this.currentData.find(item => item.id === id);
        if (!data) return;

        // Create modal content for viewing details
        const modalContent = `
            <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="detailModal">
                <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Detail Data Medis</h3>
                            <button onclick="this.closest('#detailModal').remove()" class="text-gray-400 hover:text-gray-600">
                                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><strong>Nama:</strong> ${data.nama}</div>
                            <div><strong>Nomor Riwayat:</strong> ${data.nomor_riwayat}</div>
                            <div><strong>Tanggal Lahir:</strong> ${this.formatDate(data.tanggal_lahir)}</div>
                            <div><strong>Jenis Kelamin:</strong> ${data.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                            <div class="md:col-span-2"><strong>Alamat:</strong> ${data.alamat}</div>
                            <div><strong>Nomor HP:</strong> ${data.nomor_hp}</div>
                            <div><strong>Tanggal Periksa:</strong> ${this.formatDate(data.tanggal_periksa)}</div>
                            <div class="md:col-span-2"><strong>Keluhan:</strong> ${data.keluhan}</div>
                            <div class="md:col-span-2"><strong>Diagnosa:</strong> ${data.diagnosa}</div>
                            <div class="md:col-span-2"><strong>Tindakan:</strong> ${data.tindakan}</div>
                            <div class="md:col-span-2"><strong>Resep Obat:</strong> ${data.resep_obat}</div>
                            <div class="md:col-span-2"><strong>Dokter:</strong> ${data.dokter_penanggung_jawab}</div>
                        </div>
                        <div class="flex justify-end mt-6">
                            <button onclick="this.closest('#detailModal').remove()" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalContent);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID');
    }

    showLoading() {
        document.getElementById('loadingTable').classList.remove('hidden');
        document.getElementById('dataTable').classList.add('hidden');
        document.getElementById('emptyState').classList.add('hidden');
    }

    showTable() {
        document.getElementById('loadingTable').classList.add('hidden');
        document.getElementById('dataTable').classList.remove('hidden');
        document.getElementById('emptyState').classList.add('hidden');
    }

    showEmptyState() {
        document.getElementById('loadingTable').classList.add('hidden');
        document.getElementById('dataTable').classList.add('hidden');
        document.getElementById('emptyState').classList.remove('hidden');
    }

    showError(message) {
        document.getElementById('errorText').textContent = message;
        document.getElementById('errorMessage').classList.remove('hidden');
        document.getElementById('successMessage').classList.add('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideMessages();
        }, 5000);
    }

    showSuccess(message) {
        document.getElementById('successText').textContent = message;
        document.getElementById('successMessage').classList.remove('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            this.hideMessages();
        }, 3000);
    }

    hideMessages() {
        document.getElementById('errorMessage').classList.add('hidden');
        document.getElementById('successMessage').classList.add('hidden');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dataMedisManager = new DataMedisManager();
});
