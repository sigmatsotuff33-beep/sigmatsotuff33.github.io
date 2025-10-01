class ContentManager {
    constructor() {
        this.editMode = false;
    }

    toggleEdit() {
        this.editMode = !this.editMode;
        
        if (this.editMode) {
            this.enableContentEditing();
        } else {
            this.disableContentEditing();
        }
    }

    enableContentEditing() {
        // Make all content editable
        document.querySelectorAll('h1, h2, h3, p, li, td').forEach(element => {
            element.setAttribute('contenteditable', 'true');
            element.style.border = '1px dashed #00ff88';
            element.style.padding = '2px';
        });

        // Add save buttons
        this.addSaveButtons();
    }

    disableContentEditing() {
        document.querySelectorAll('[contenteditable="true"]').forEach(element => {
            element.removeAttribute('contenteditable');
            element.style.border = 'none';
            element.style.padding = '0';
        });

        this.removeSaveButtons();
    }

    addSaveButtons() {
        const saveBtn = document.createElement('button');
        saveBtn.innerHTML = '💾 Save All Changes';
        saveBtn.style.position = 'fixed';
        saveBtn.style.bottom = '20px';
        saveBtn.style.right = '20px';
        saveBtn.style.zIndex = '1000';
        saveBtn.style.background = '#00ff88';
        saveBtn.style.color = 'black';
        saveBtn.style.padding = '10px 15px';
        saveBtn.style.border = 'none';
        saveBtn.style.borderRadius = '5px';
        saveBtn.style.cursor = 'pointer';
        saveBtn.onclick = () => this.saveAllChanges();
        
        document.body.appendChild(saveBtn);
        this.saveBtn = saveBtn;
    }

    removeSaveButtons() {
        if (this.saveBtn) {
            this.saveBtn.remove();
        }
    }

    saveAllChanges() {
        const siteContent = {
            title: document.title,
            sections: {}
        };

        // Save each section content
        document.querySelectorAll('section, div.section').forEach((section, index) => {
            siteContent.sections[`section_${index}`] = section.innerHTML;
        });

        // Save to localStorage (in real scenario, save to GitHub via API)
        localStorage.setItem('ci_website_content', JSON.stringify(siteContent));
        
        alert('Changes saved locally! To make permanent, you need to update GitHub repository.');
        this.toggleEdit();
    }
}

const contentManager = new ContentManager();
