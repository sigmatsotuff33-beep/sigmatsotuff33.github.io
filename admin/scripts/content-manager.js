class ContentManager {
    constructor() {
        this.pages = [];
    }

    async loadPages() {
        try {
            this.pages = await adminCore.apiCall('/api/content/pages');
            this.renderPagesTable();
        } catch (error) {
            console.error('Failed to load pages:', error);
        }
    }

    renderPagesTable() {
        const table = document.getElementById('pagesTable');
        table.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>URL</th>
                        <th>Last Modified</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.pages.map(page => this.renderPageRow(page)).join('')}
                </tbody>
            </table>
        `;
    }

    renderPageRow(page) {
        return `
            <tr>
                <td>${page.title}</td>
                <td>/${page.slug}</td>
                <td>${new Date(page.updatedAt).toLocaleDateString()}</td>
                <td><span class="status-badge ${page.status}">${page.status}</span></td>
                <td class="actions">
                    <button onclick="contentManager.editPage('${page.id}')" class="btn-sm">Edit</button>
                    <button onclick="contentManager.deletePage('${page.id}')" class="btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
    }

    async createPage(pageData) {
        try {
            const newPage = await adminCore.apiCall('/api/content/pages', {
                method: 'POST',
                body: JSON.stringify(pageData)
            });
            this.pages.push(newPage);
            this.renderPagesTable();
            this.hideModal('createPageModal');
        } catch (error) {
            adminCore.showError('Failed to create page');
        }
    }

    async editPage(pageId) {
        const page = this.pages.find(p => p.id === pageId);
        // Open editor with page content
        this.openEditor(page);
    }

    async deletePage(pageId) {
        if (confirm('Are you sure you want to delete this page?')) {
            try {
                await adminCore.apiCall(`/api/content/pages/${pageId}`, {
                    method: 'DELETE'
                });
                this.pages = this.pages.filter(p => p.id !== pageId);
                this.renderPagesTable();
            } catch (error) {
                adminCore.showError('Failed to delete page');
            }
        }
    }

    openEditor(page = null) {
        // Open rich text editor for page content
        const editorHtml = `
            <div class="modal-overlay">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3>${page ? 'Edit Page' : 'Create Page'}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <form onsubmit="contentManager.savePage(event, '${page?.id}')">
                        <div class="input-group">
                            <label>Title</label>
                            <input type="text" name="title" value="${page?.title || ''}" required>
                        </div>
                        <div class="input-group">
                            <label>URL Slug</label>
                            <input type="text" name="slug" value="${page?.slug || ''}" required>
                        </div>
                        <div class="input-group">
                            <label>Content</label>
                            <textarea name="content" rows="10" style="width: 100%;">${page?.content || ''}</textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn-primary">Save Page</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', editorHtml);
    }

    async savePage(event, pageId = null) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const pageData = {
            title: formData.get('title'),
            slug: formData.get('slug'),
            content: formData.get('content')
        };

        if (pageId) {
            await this.updatePage(pageId, pageData);
        } else {
            await this.createPage(pageData);
        }
    }
}

// Initialize content manager
const contentManager = new ContentManager();
