  // Generates a random 6-character code for groups
  function generateGroupCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
import { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
// Dummy group type
type Group = {
  id: number;
  name: string;
  type: string;
  icon: string;
  member_count: number;
  code: string;
};
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([{
    id: 1,
    name: 'Demo Friends',
    type: 'Friends',
    icon: 'DF',
    member_count: 1,
    code: 'A1B2C3',
  }]);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState<{ groupId: number; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  // No backend: just add to local state
  function handleCreateGroup() {
    if (!selectedType || !groupName.trim()) return;

    const initials = groupName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);

    const newGroup: Group = {
      id: Date.now(),
      name: groupName,
      type: selectedType,
      icon: initials,
      member_count: 1,
      code: generateGroupCode(),
    };
    setGroups([newGroup, ...groups]);
    setShowModal(false);
    setGroupName('');
    setSelectedType(null);
  }

  function getGroupColor(type: string) {
    switch (type) {
      case 'Friends':
        return 'from-pink-500 to-rose-500';
      case 'Study Group':
        return 'from-blue-500 to-indigo-500';
      case 'UniClubs':
        return 'from-teal-500 to-emerald-500';
      default:
        return 'from-slate-500 to-slate-600';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 flex flex-col">
      <div className="max-w-6xl mx-auto pt-8 w-full flex flex-col h-full" style={{ minHeight: '80vh' }}>
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Communities</h1>
        <div className="flex h-[70vh] rounded-xl overflow-hidden shadow-2xl">
          {/* Sidebar: Group List */}
          <div className="w-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-r border-slate-800 p-8 flex flex-col items-center rounded-xl shadow-xl">
            <button
              onClick={() => setShowModal(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white shadow-lg border-4 border-white/10 hover:scale-105 hover:shadow-xl transition-all duration-150"
              aria-label="Create new group"
              style={{ marginBottom: '2.5rem' }}
            >
              <Plus className="w-7 h-7" />
            </button>
            <div className="flex flex-col items-center gap-6 w-full">
              {groups.map((group) => (
                <button
                  key={group.id}
                  className={`w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br ${getGroupColor(group.type)} text-white font-bold text-base shadow-lg border-4 border-white/10 hover:scale-110 hover:shadow-xl transition-all duration-150 ${selectedGroup?.id === group.id ? 'ring-4 ring-teal-400' : ''}`}
                  onClick={() => setSelectedGroup(group)}
                  aria-label={group.name}
                >
                  <span className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-900/60 border border-slate-700 text-xs font-bold shadow-inner">{group.icon}</span>
                </button>
              ))}
            </div>

            {/* Modal for creating a group */}
            {showModal && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full max-w-xs shadow-2xl">
                  <div className="flex gap-2 mb-6">
                    <button className={`flex-1 px-4 py-2 rounded-lg font-semibold ${modalTab === 'create' ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white' : 'bg-slate-900/50 text-slate-300'}`} onClick={() => { setModalTab('create'); setJoinError(''); }}>
                      Create Group
                    </button>
                    <button className={`flex-1 px-4 py-2 rounded-lg font-semibold ${modalTab === 'join' ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white' : 'bg-slate-900/50 text-slate-300'}`} onClick={() => { setModalTab('join'); setGroupName(''); setSelectedType(null); }}>
                      Join Group
                    </button>
                  </div>
                  {modalTab === 'create' ? (
                    <>
                      <h2 className="text-xl font-bold text-white mb-6">Create New Group</h2>
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Group Name</label>
                          <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            placeholder="Enter group name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-3">Group Type</label>
                          <div className="space-y-2">
                            {['Friends', 'School Club', 'UniClubs'].map((type) => (
                              <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                                  selectedType === type
                                    ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg shadow-teal-500/30'
                                    : 'bg-slate-900/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowModal(false);
                            setGroupName('');
                            setSelectedType(null);
                            setModalTab('create');
                          }}
                          className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateGroup}
                          disabled={!selectedType || !groupName.trim()}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Create
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-white mb-6">Join Group</h2>
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Group Code</label>
                          <input
                            type="text"
                            value={joinCode}
                            onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            placeholder="Enter group code"
                          />
                          {joinError && <div className="text-red-400 text-sm mt-2">{joinError}</div>}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowModal(false);
                            setJoinCode('');
                            setJoinError('');
                            setModalTab('create');
                          }}
                          className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const found = groups.find(g => g.code === joinCode.trim().toUpperCase());
                            if (found) {
                              setGroups(groups.map(g => g.id === found.id ? { ...g, member_count: g.member_count + 1 } : g));
                              setShowModal(false);
                              setJoinCode('');
                              setSelectedGroup(found);
                              setModalTab('create');
                            } else {
                              setJoinError('Group not found!');
                            }
                          }}
                          disabled={!joinCode.trim()}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Join
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Area: Chat or Welcome */}
          <div className="flex-1 bg-slate-800/60 p-8 flex flex-col h-full">
            {!selectedGroup ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <h2 className="text-2xl font-bold mb-4">Select a group to start chatting</h2>
                <p className="mb-2">Or create a new group using the + button.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br ${getGroupColor(selectedGroup.type)} text-white font-bold text-base shadow-lg`}>{selectedGroup.icon}</span>
                  <h2 className="text-lg font-bold text-white">{selectedGroup.name} Chat</h2>
                  <div className="ml-4 flex items-center gap-2">
                    <span className="text-slate-400 text-sm font-mono bg-slate-900 px-2 py-1 rounded">{selectedGroup.code || 'A1B2C3'}</span>
                    <button
                      className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                      onClick={async () => {
                        await navigator.clipboard.writeText(selectedGroup.code || 'A1B2C3');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1200);
                      }}
                      type="button"
                    >{copied ? 'Copied!' : 'Copy'}</button>
                  </div>
                  <button className="ml-auto px-3 py-1 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all font-medium text-sm" onClick={() => setSelectedGroup(null)}>Back to Groups</button>
                </div>
                {/* Welcome message at top center */}
                <div className="w-full flex justify-center mb-4">
                  <span className="text-slate-400 text-base font-medium">Hi! This is your group chat.</span>
                </div>
                <div className="flex-1 flex flex-col gap-2 mb-4 overflow-y-auto">
                  {messages.filter(m => m.groupId === selectedGroup.id).map((msg, idx) => (
                    <div key={idx} className="self-end bg-teal-500/30 text-white px-4 py-2 rounded-lg max-w-xs">{msg.text}</div>
                  ))}
                </div>
                <form className="flex gap-2 mt-auto" onSubmit={e => {
                  e.preventDefault();
                  if (chatInput.trim()) {
                    setMessages([...messages, { groupId: selectedGroup.id, text: chatInput }]);
                    setChatInput('');
                  }
                }}>
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-900 text-white border border-slate-700"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-semibold shadow-lg">Send</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
