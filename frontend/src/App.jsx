import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AppLauncher from './components/AppLauncher';
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
  const [activeSubView, setActiveSubView] = useState('orders');
  const [launcherOpen, setLauncherOpen] = useState(false);

  // Cross-module direct navigation states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveApp('dashboard');
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

  const handleSelectApp = (appId) => {
    setActiveApp(appId);
    if (appId === 'sales') setActiveSubView('orders');
    if (appId === 'inventory') setActiveSubView('products');
    if (appId === 'invoicing') {
      setActiveSubView('invoices');
      setSelectedInvoiceId(null);
    }
    if (appId === 'contacts') setActiveSubView('all');
  };

  const handleOpenDelivery = (origin) => {
    setActiveApp('inventory');
    setActiveSubView('pickings');
  };

  const handleOpenInvoice = (orderId) => {
    setActiveApp('invoicing');
    setActiveSubView('invoices');
    setSelectedInvoiceId(null);
  };

  // Si no está autenticado, mostramos la pantalla de Login
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Odoo Style Top Navbar */}
      <Navbar
        activeApp={activeApp}
        setActiveApp={setActiveApp}
        onOpenLauncher={() => setLauncherOpen(true)}
        activeSubView={activeSubView}
        setActiveSubView={setActiveSubView}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
      />

      {/* App Launcher (Waffle 9-dots modal) */}
      <AppLauncher
        isOpen={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        onSelectApp={handleSelectApp}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeApp === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            onNavigateApp={handleSelectApp}
            onNewOrder={() => {
              setActiveApp('sales');
              setActiveSubView('orders');
            }}
            onNewContact={() => {
              setActiveApp('contacts');
              setActiveSubView('all');
            }}
            onNewProduct={() => {
              setActiveApp('inventory');
              setActiveSubView('products');
            }}
          />
        )}

        {activeApp === 'sales' && (
          activeSubView === 'customers' ? (
            <ContactsView subView="customers" currentUser={currentUser} onHome={() => setActiveApp('dashboard')} />
          ) : activeSubView === 'products' ? (
            <InventoryView subView="products" currentUser={currentUser} onHome={() => setActiveApp('dashboard')} />
          ) : (
            <SalesView
              currentUser={currentUser}
              onOpenDelivery={handleOpenDelivery}
              onOpenInvoice={handleOpenInvoice}
              onHome={() => setActiveApp('dashboard')}
            />
          )
        )}

        {activeApp === 'inventory' && (
          <InventoryView subView={activeSubView} currentUser={currentUser} onHome={() => setActiveApp('dashboard')} />
        )}

        {activeApp === 'invoicing' && (
          <InvoicingView defaultInvoiceId={selectedInvoiceId} currentUser={currentUser} onHome={() => setActiveApp('dashboard')} />
        )}

        {activeApp === 'contacts' && (
          <ContactsView subView={activeSubView} currentUser={currentUser} onHome={() => setActiveApp('dashboard')} />
        )}
      </main>
    </div>
  );
}
