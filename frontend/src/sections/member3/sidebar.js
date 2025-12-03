// src/sections/member3/sidebar.js
export function initSidebar() {
  const container = document.getElementById('sidebar-content');
  
  container.innerHTML = `
    <div class="empty-state">
      <h3>Sidebar Content</h3>
      <p>Add content here</p>
    </div>
  `;
}