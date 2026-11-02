import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './modules/dashboard/DashboardView';
import SalesView from './modules/sales/SalesView';
import InventoryView from './modules/inventory/InventoryView';
import InvoicingView from './modules/invoicing/InvoicingView';
import ContactsView from './modules/contacts/ContactsView';
import LoginView from './modules/auth/LoginView';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('erp_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeApp, setActiveApp] = useState('dashboard');
  const [activeSubView, setActiveSubView] = useState('main');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveApp('dashboard');
    setActiveSubView('main');
  };

  const handleLogout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setCurrentUser(null);
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('erp_user', JSON.stringify(updatedUser));
  };

  const handleSelectApp = (appId, subView = null) => {
    setActiveApp(appId);
    setMobileMenuOpen(false); // Auto close mobile drawer on navigation
    if (subView) {
      setActiveSubView(subView);
    } else {
      if (appId === 'dashboard') setActiveSubView('main');
      if (appId === 'sales') setActiveSubView('orders');
      if (appId === 'inventory') setActiveSubView('pickings');
      if (appId === 'invoicing') {
        setActiveSubView('invoices');
        setSelectedInvoiceId(null);
      }
      if (appId === 'contacts') setActiveSubView('all');
    }
  };

  const handleOpenDelivery = () => {
    setActiveApp('inventory');
    setActiveSubView('pickings');
    setMobileMenuOpen(false);
  };

  const handleOpenInvoice = () => {
    setActiveApp('invoicing');
    setActiveSubView('invoices');
    setSelectedInvoiceId(null);
    setMobileMenuOpen(false);
  };

  // Login view if unauthenticated
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen w-screen bg-slate-50 flex overflow-hidden font-sans antialiased text-slate-800 relative">
      {/* Professional Responsive Collapsible Sidebar & Mobile Drawer */}
      <Sidebar
        activeApp={activeApp}
        activeSubView={activeSubView}
        onSelectApp={handleSelectApp}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        currentUser={currentUser}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Modern Top Header */}
        <Header
          activeApp={activeApp}
          activeSubView={activeSubView}
          onNavigateHome={() => handleSelectApp('dashboard', 'main')}
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          currentUser={currentUser}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Module Content View */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activeApp === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              onNavigateApp={handleSelectApp}
              onNewOrder={() => handleSelectApp('sales', 'orders')}
              onNewContact={() => handleSelectApp('contacts', 'all')}
              onNewProduct={() => handleSelectApp('inventory', 'products')}
            />
          )}

          {activeApp === 'sales' && (
            <SalesView
              currentUser={currentUser}
              onOpenDelivery={handleOpenDelivery}
              onOpenInvoice={handleOpenInvoice}
              onHome={() => handleSelectApp('dashboard', 'main')}
            />
          )}

          {activeApp === 'inventory' && (
            <InventoryView
              subView={activeSubView}
              currentUser={currentUser}
              onHome={() => handleSelectApp('dashboard', 'main')}
            />
          )}

          {activeApp === 'invoicing' && (
            <InvoicingView
              defaultInvoiceId={selectedInvoiceId}
              currentUser={currentUser}
              onHome={() => handleSelectApp('dashboard', 'main')}
            />
          )}

          {activeApp === 'contacts' && (
            <ContactsView
              subView={activeSubView}
              currentUser={currentUser}
              onHome={() => handleSelectApp('dashboard', 'main')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
