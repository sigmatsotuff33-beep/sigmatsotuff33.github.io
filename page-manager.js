class PageManager {
    showPageCreator() {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000;">
                <div style="background: #1a1a1a; margin: 50px auto; padding: 30px; border-radius: 10px; max-width: 600px; border: 1px solid #00ff88;">
                    <h3 style="color: #00ff88;">Create New Page</h3>
                    <form id="createPageForm">
                        <input type="text" id="pageTitle" placeholder="Page Title" style="width: 100%; padding: 10px; margin: 10px 0; background: #2a2a2a; border: 1px solid #333; color: white;">
                        <input type="text" id="pageUrl" placeholder="page-url" style="width: 100%; padding: 10px; margin: 10px 0; background: #2a2a2a; border: 1px solid #333; color: white;">
                        <textarea id="pageContent" placeholder="Page content (HTML supported)" style="width: 100%; height: 200px; padding: 10px; margin: 10px 0; background: #2a2a2a; border: 1px solid #333; color: white;"></textarea>
                        <button type="submit" style="padding: 10px 20px; background: #00ff88; color: black; border: none; border-radius: 5px; cursor: pointer;">Create Page</button>
                    </form>
                    <button onclick="modal.remove()" style="padding: 10px 20px; background: #444; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        document.getElementById('createPageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPage();
            modal.remove();
        });
    }

    createPage() {
        const title = document.getElementById('pageTitle').value;
        const url = document.getElementById('pageUrl').value;
        const content = document.getElementById('pageContent').value;

        // Save page to localStorage
        const pages = JSON.parse(localStorage.getItem('ci_custom_pages') || '{}');
        pages[url] = {
            title,
            content,
            created: new Date().toISOString(),
            createdBy: adminAuth.currentUser.username
        };
        
        localStorage.setItem('ci_custom_pages', JSON.stringify(pages));
        
        // Add to navigation
        this.addPageToNav(title, url);
        
        alert(`Page "${title}" created! Access at: ${window.location.origin}/${url}.html`);
    }

    addPageToNav(title, url) {
        // This would require manual addition to your navigation
        console.log(`Add this to your nav: <a href="${url}.html">${title}</a>`);
    }
}

const pageManager = new PageManager();
