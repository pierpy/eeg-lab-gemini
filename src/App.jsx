import React, { useState, useEffect } from 'react';
// ⚠️ PER VERCEL/LOCALE: DECOMMENTA LA RIGA QUI SOTTO E INSTALLA LA LIBRERIA
import { createClient } from '@supabase/supabase-js';

import { 
  Camera, 
  FileText, 
  Users, 
  Plus, 
  LogOut, 
  ChevronRight, 
  Calendar, 
  Activity, 
  Trash2, 
  Save, 
  ArrowLeft,
  Database,
  Loader2,
  Key,
  Check,
  User,
  Pencil
} from 'lucide-react';

// --- CONFIGURAZIONE SUPABASE ---
// ⚠️ PER VERCEL/LOCALE: DECOMMENTA IL BLOCCO QUI SOTTO

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Mancano le variabili d'ambiente di Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)");
}

const supabase = createClient(supabaseUrl, supabaseKey);


// --- MOCK CLIENT (DA RIMUOVERE/COMMENTARE PRIMA DI VERCEL) ---
// Questo serve solo per non far crashare l'anteprima in questa chat.
// Quando usi il codice reale sopra, puoi cancellare o commentare questo blocco.
/* const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: { message: "Anteprima: Decommenta il codice Supabase reale in App.jsx per il login." } }),
    signUp: async () => ({ error: { message: "Funzione disponibile solo con Supabase reale attivato." } }),
    signOut: async () => {},
  },
  from: () => ({
    select: () => ({ order: () => Promise.resolve({ data: [], error: null }), eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
    insert: () => Promise.resolve({ error: { message: "DB non connesso." } }),
    update: () => ({ eq: () => Promise.resolve({ error: { message: "DB non connesso." } }) }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    eq: () => ({ single: () => Promise.resolve({ data: null }) })
  })
}; */
// -----------------------------------------------------------

// --- COMPONENTI ---

// 1. AUTH SCREEN
const AuthScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isRegistering) {
        if (!inviteCode) throw new Error("Il codice invito è obbligatorio.");
        result = await supabase.auth.signUp({
          email,
          password,
          options: { data: { invite_code: inviteCode } }
        });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }
      if (result.error) throw result.error;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-600 p-3 rounded-full">
            <Activity className="text-white w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">EEG Lab Manager</h1>
        <p className="text-center text-slate-500 mb-8">Accesso Laboratorio</p>

        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-3 rounded mb-4">
          <strong>Setup:</strong> Ricordati di decommentare le righe di Supabase nel codice per collegare il database reale!
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" required className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" required className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {isRegistering && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-emerald-700 mb-1">Codice Invito</label>
              <input type="text" required placeholder="Es. RES-1234" className="w-full p-3 rounded-lg border-2 border-emerald-100 focus:border-emerald-500 outline-none font-mono" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
            </div>
          )}
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Registrati' : 'Accedi')}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-emerald-600 text-sm font-medium hover:underline">
            {isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. DASHBOARD
const Dashboard = ({ session, profile, onSelectExperiment }) => {
  const [experiments, setExperiments] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchExperiments = async () => {
    const { data, error } = await supabase
      .from('experiments')
      .select('*, profiles:created_by ( email )') 
      .order('created_at', { ascending: false });

    if (error) console.error("Errore fetch:", error);
    else setExperiments(data || []);
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { error } = await supabase
      .from('experiments')
      .insert({
        name: formData.get('name'),
        experimenter: formData.get('experimenter'),
        date: formData.get('date'), 
        notes: formData.get('notes'),
        created_by: session.user.id
      });

    if (!error) {
      setShowNewModal(false);
      fetchExperiments();
    } else {
      alert("Errore creazione: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="text-emerald-600 w-6 h-6" />
            <h1 className="font-bold text-lg text-slate-800">EEG Lab</h1>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs font-mono px-2 py-1 bg-slate-100 rounded text-slate-600 font-bold">
               {profile?.role}
             </span>
             {profile?.role === 'ADMIN' && (
               <button onClick={() => setShowInviteModal(true)} className="p-2 text-emerald-600 bg-emerald-50 rounded-full hover:bg-emerald-100" title="Genera Codice">
                 <Key className="w-5 h-5" />
               </button>
             )}
             <button onClick={() => supabase.auth.signOut()} className="p-2 text-slate-400 hover:text-red-500">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {profile?.role === 'ADMIN' ? 'Tutti gli Esperimenti' : 'I Miei Esperimenti'}
        </h2>

        {experiments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nessun esperimento trovato.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {experiments.map(exp => (
              <div 
                key={exp.id} 
                onClick={() => onSelectExperiment(exp)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-slate-800">{exp.name}</h3>
                    {profile?.role === 'ADMIN' && exp.profiles?.email && (
                      <div className="flex items-center gap-1 mt-1 mb-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Creato da:</span>
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100 flex items-center gap-1">
                           <User className="w-3 h-3" /> {exp.profiles.email}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {exp.experimenter}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(exp.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300 w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <button onClick={() => setShowNewModal(true)} className="fixed bottom-6 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 active:scale-90">
        <Plus className="w-6 h-6" />
      </button>

      {/* MODAL NUOVO ESPERIMENTO */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Nuovo Esperimento</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input name="name" placeholder="Nome Esperimento" required className="w-full p-3 bg-slate-50 rounded-lg outline-none" />
              <input name="experimenter" placeholder="Sperimentatore" defaultValue={session.user.email} required className="w-full p-3 bg-slate-50 rounded-lg outline-none" />
              <input name="date" type="datetime-local" required className="w-full p-3 bg-slate-50 rounded-lg outline-none" />
              <textarea name="notes" placeholder="Note..." className="w-full p-3 bg-slate-50 rounded-lg outline-none h-24" />
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowNewModal(false)} className="flex-1 py-3 text-slate-600">Annulla</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-lg">Crea</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInviteModal && <InviteGenerator onClose={() => setShowInviteModal(false)} session={session} />}
    </div>
  );
};

// 3. GENERATORE INVITI
const InviteGenerator = ({ onClose, session }) => {
  const [role, setRole] = useState('RESEARCHER');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInvite = async () => {
    setLoading(true);
    const prefix = role === 'ADMIN' ? 'ADM' : 'RES';
    const newCode = `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const { error } = await supabase.from('invites').insert({
      code: newCode, role, created_by: session.user.id
    });
    if (error) alert(error.message);
    else setGeneratedCode(newCode);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-emerald-600"/> Genera Invito</h3>
        {!generatedCode ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              {['RESEARCHER', 'ADMIN'].map(r => (
                <button key={r} onClick={() => setRole(r)} className={`flex-1 py-2 rounded-lg border-2 font-bold text-xs ${role === r ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>{r}</button>
              ))}
            </div>
            <button onClick={generateInvite} disabled={loading} className="w-full py-3 bg-slate-800 text-white rounded-lg">{loading ? '...' : 'Genera'}</button>
            <button onClick={onClose} className="w-full py-2 text-slate-500 text-sm">Annulla</button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-slate-100 p-4 rounded-xl font-mono font-bold text-2xl tracking-wider select-all">{generatedCode}</div>
            <button onClick={onClose} className="w-full py-3 bg-emerald-600 text-white rounded-lg">Fatto</button>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. DETTAGLIO ESPERIMENTO (Con Eliminazione)
const ExperimentDetail = ({ experiment: initialExperiment, session, profile, onBack }) => {
  const [experiment, setExperiment] = useState(initialExperiment);
  const [sessions, setSessions] = useState([]);
  const [isEditingExp, setIsEditingExp] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState(null); 
  const [uploading, setUploading] = useState(false);

  const canEdit = profile?.role === 'ADMIN' || experiment.created_by === session.user.id;

  const fetchSessions = async () => {
    const { data } = await supabase.from('sessions').select('*').eq('experiment_id', experiment.id).order('created_at', { ascending: false });
    setSessions(data || []);
  };
  useEffect(() => { fetchSessions(); }, [experiment]);

  // ELIMINA ESPERIMENTO
  const handleDeleteExperiment = async () => {
    if (!window.confirm("⚠️ SEI SICURO? Eliminando l'esperimento verranno cancellate anche tutte le sue sessioni.")) return;
    
    const { error } = await supabase.from('experiments').delete().eq('id', experiment.id);
    if (error) alert(error.message);
    else onBack();
  };

  const handleUpdateExperiment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = {
      name: formData.get('name'),
      experimenter: formData.get('experimenter'),
      date: formData.get('date'),
      notes: formData.get('notes')
    };

    const { error } = await supabase.from('experiments').update(updates).eq('id', experiment.id);
    
    if (!error) {
      setExperiment({ ...experiment, ...updates });
      setIsEditingExp(false);
    } else {
      alert("Errore aggiornamento: " + error.message);
    }
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const photoFile = formData.get('photo');
    let photoUrl = sessionToEdit?.setup_photo_url || null;

    setUploading(true);
    
    if (photoFile && photoFile.size > 0) {
      const fileName = `${Math.random()}.${photoFile.name.split('.').pop()}`;
      const { data, error } = await supabase.storage.from('photos').upload(fileName, photoFile);
      if (!error) photoUrl = supabase.storage.from('photos').getPublicUrl(fileName).data.publicUrl;
    }

    const sessionData = {
      experiment_id: experiment.id,
      subject_id: formData.get('subjectId'),
      date: formData.get('date'),
      eeg_filename: formData.get('eegFile'),
      bad_channels: formData.get('badChannels'),
      notes: formData.get('notes'),
      setup_photo_url: photoUrl
    };

    let error;
    if (sessionToEdit?.id) {
      const res = await supabase.from('sessions').update(sessionData).eq('id', sessionToEdit.id);
      error = res.error;
    } else {
      const res = await supabase.from('sessions').insert(sessionData);
      error = res.error;
    }

    setUploading(false);
    if (!error) { 
      setSessionToEdit(null); 
      fetchSessions(); 
    } else {
      alert("Errore: " + error.message);
    }
  };

  const handleDeleteSession = async (id) => {
    if(window.confirm("Eliminare questa sessione?")) {
      await supabase.from('sessions').delete().eq('id', id);
      fetchSessions();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg truncate">{experiment.name}</h2>
          <p className="text-xs text-slate-500 truncate">ID: {experiment.id.slice(0,8)}...</p>
        </div>
        
        {canEdit && (
          <div className="flex gap-1">
            <button onClick={() => setIsEditingExp(true)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
              <Pencil className="w-5 h-5" />
            </button>
            <button onClick={handleDeleteExperiment} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sperimentatore</label>
               <p className="text-sm font-medium text-slate-800">{experiment.experimenter}</p>
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Inizio</label>
               <p className="text-sm font-medium text-slate-800">{new Date(experiment.date).toLocaleDateString()}</p>
             </div>
           </div>
           {experiment.notes && (
             <div className="mt-4 pt-4 border-t border-slate-50">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Note</label>
                <p className="text-sm text-slate-600 mt-1 italic">{experiment.notes}</p>
             </div>
           )}
        </div>

        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          Sessioni <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{sessions.length}</span>
        </h3>
        
        <div className="space-y-3">
          {sessions.map(sess => (
            <div key={sess.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h4 className="font-bold text-emerald-600 flex items-center gap-2">
                  <Users className="w-4 h-4" /> {sess.subject_id}
                </h4>
                {canEdit && (
                  <div className="flex gap-1">
                    <button onClick={() => setSessionToEdit(sess)} className="text-slate-400 hover:text-emerald-600 p-2 rounded-full hover:bg-white transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteSession(sess.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-white transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 text-sm space-y-2">
                 <p className="flex gap-2 items-center"><FileText className="w-4 h-4 text-slate-400"/> <span className="text-slate-500">File:</span> <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">{sess.eeg_filename}</span></p>
                 {sess.bad_channels && <p className="flex gap-2 items-center"><Activity className="w-4 h-4 text-orange-400"/> <span className="text-slate-500">Bad Ch:</span> {sess.bad_channels}</p>}
                 {sess.setup_photo_url && (
                   <div className="mt-3">
                     <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Camera className="w-3 h-3"/> Setup Foto:</p>
                     <img src={sess.setup_photo_url} alt="Setup" className="w-full h-40 object-cover rounded-lg border border-slate-100" />
                   </div>
                 )}
                 {sess.notes && <p className="text-xs text-slate-500 italic mt-2 border-l-2 border-slate-200 pl-2">{sess.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </main>

      {canEdit && (
        <button onClick={() => setSessionToEdit({})} className="fixed bottom-6 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 flex gap-2 pr-6 transition-transform active:scale-95">
          <Plus className="w-6 h-6" /> <span className="font-bold">Sessione</span>
        </button>
      )}

      {isEditingExp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Modifica Esperimento</h3>
            <form onSubmit={handleUpdateExperiment} className="space-y-4">
              <input name="name" defaultValue={experiment.name} placeholder="Nome Esperimento" required className="w-full p-3 bg-slate-50 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              <input name="experimenter" defaultValue={experiment.experimenter} placeholder="Sperimentatore" required className="w-full p-3 bg-slate-50 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              <input name="date" type="datetime-local" defaultValue={new Date(experiment.date).toISOString().slice(0, 16)} required className="w-full p-3 bg-slate-50 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              <textarea name="notes" defaultValue={experiment.notes} placeholder="Note..." className="w-full p-3 bg-slate-50 rounded-lg outline-none h-24 focus:ring-2 focus:ring-emerald-500" />
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsEditingExp(false)} className="flex-1 py-3 text-slate-600 font-medium">Annulla</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-medium rounded-lg">Salva Modifiche</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sessionToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{sessionToEdit.id ? 'Modifica Sessione' : 'Nuova Sessione'}</h3>
            <form onSubmit={handleSaveSession} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <input name="subjectId" defaultValue={sessionToEdit.subject_id} placeholder="ID Soggetto" required className="p-3 bg-slate-50 rounded-lg outline-none" />
                 <input name="date" type="datetime-local" defaultValue={sessionToEdit.date ? new Date(sessionToEdit.date).toISOString().slice(0, 16) : ''} required className="p-3 bg-slate-50 rounded-lg outline-none" />
               </div>
               <input name="eegFile" defaultValue={sessionToEdit.eeg_filename} placeholder="Nome file EEG" className="w-full p-3 bg-slate-50 rounded-lg outline-none font-mono" />
               <input name="badChannels" defaultValue={sessionToEdit.bad_channels} placeholder="Bad Channels" className="w-full p-3 bg-slate-50 rounded-lg outline-none" />
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Foto Setup {sessionToEdit.setup_photo_url && '(Lascia vuoto per mantenere attuale)'}</label>
                  <input type="file" name="photo" accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
               </div>
               <textarea name="notes" defaultValue={sessionToEdit.notes} placeholder="Note..." className="w-full p-3 bg-slate-50 rounded-lg outline-none h-20" />
               <div className="flex gap-3 mt-4">
                 <button type="button" onClick={() => setSessionToEdit(null)} className="flex-1 py-3 text-slate-600 font-medium">Annulla</button>
                 <button type="submit" disabled={uploading} className="flex-1 py-3 bg-emerald-600 text-white rounded-lg flex justify-center gap-2">
                    {uploading ? 'Caricamento...' : <><Save className="w-4 h-4" /> Salva</>}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 5. MAIN APP CONTAINER
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Caricamento...</div>;

  if (!session) return <AuthScreen />;

  if (selectedExperiment) {
    return (
      <ExperimentDetail 
        experiment={selectedExperiment} 
        session={session}
        profile={profile}
        onBack={() => setSelectedExperiment(null)}
      />
    );
  }

  return (
    <Dashboard 
      session={session} 
      profile={profile} 
      onSelectExperiment={setSelectedExperiment}
    />
  );
}