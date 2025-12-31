import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

let csrfToken = null;

// Fetch CSRF token on first request
async function ensureCSRFToken() {
    if (!csrfToken) {
        const response = await api.get('/csrf-token');
        csrfToken = response.data.token;
    }
    return csrfToken;
}

// Add CSRF token to non-GET requests
api.interceptors.request.use(async (config) => {
    if (config.method !== 'get') {
        const token = await ensureCSRFToken();
        config.headers['X-CSRF-Token'] = token;
    }
    return config;
});

// Files API
export const filesApi = {
    list: (path = '/', sort = 'name', dir = 'asc') =>
        api.get('/files', { params: { path, sort, dir } }),

    upload: (file, directory = '/', overwrite = false, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('directory', directory);
        formData.append('overwrite', overwrite.toString());

        return api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percent);
                }
            }
        });
    },

    rename: (path, newName) =>
        api.post('/files/rename', { path, new_name: newName }),

    move: (path, destination) =>
        api.post('/files/move', { path, destination }),

    replace: (path, file, onProgress) => {
        const formData = new FormData();
        formData.append('path', path);
        formData.append('file', file);

        return api.post('/files/replace', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percent);
                }
            }
        });
    },

    delete: (path, confirmFilename) =>
        api.post('/files/delete', { path, confirm_filename: confirmFilename }),

    mkdir: (path, name) =>
        api.post('/files/mkdir', { path, name }),

    getMetadata: (path) =>
        api.get('/metadata', { params: { path } }),

    downloadZip: async (paths) => {
        const response = await api.post('/files/zip', { paths }, {
            responseType: 'blob'
        });
        // Trigger download
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        const filename = paths.length === 1
            ? paths[0].split('/').pop() + '.zip'
            : 'download.zip';
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return response;
    }
};

// Logs API
export const logsApi = {
    list: (limit = 50, offset = 0) =>
        api.get('/logs', { params: { limit, offset } })
};

// Settings API
export const settingsApi = {
    get: () => api.get('/settings'),
    update: (settings) => api.put('/settings', settings)
};

export default api;
