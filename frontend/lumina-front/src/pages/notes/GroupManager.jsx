import React, { useState } from "react";
import {
  Folder,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Grid,
  Star,
  X,
  Check,
  Move,
  MoreVertical,
  GripVertical,
  FileText,
  Image as ImageIcon
} from "lucide-react";

import { useTheme } from "./ThemeContext";

const colors = [
  { name: "indigo", class: "bg-indigo-500", light: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { name: "blue", class: "bg-blue-500", light: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { name: "green", class: "bg-green-500", light: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { name: "yellow", class: "bg-yellow-500", light: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { name: "red", class: "bg-red-500", light: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  { name: "purple", class: "bg-purple-500", light: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { name: "pink", class: "bg-pink-500", light: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  { name: "orange", class: "bg-orange-500", light: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { name: "teal", class: "bg-teal-500", light: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  { name: "gray", class: "bg-gray-500", light: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" }
];

const icons = [
  { name: "Folder", icon: Folder },
  { name: "Star", icon: Star },
  { name: "FileText", icon: FileText },
  { name: "Image", icon: ImageIcon }
];

export default function GroupManager({
  isOpen,
  onClose,
  groups = [],
  notes = [],
  selectedGroupId,
  onGroupSelect,
  onGroupCreate,
  onGroupUpdate,
  onGroupDelete,
  onMoveNoteToGroup
}) {
  const { themeClasses } = useTheme();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [showMenu, setShowMenu] = useState(null);
  const [dragOverGroup, setDragOverGroup] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "indigo",
    icon: "Folder"
  });

  if (!isOpen) return null;

  const systemGroups = [
    { id: "all", name: "Все заметки", icon: Grid, count: notes.length },
    { id: "favorites", name: "Избранное", icon: Star, count: notes.filter(n => n.isFavorite).length },
    { id: "recent", name: "Недавние", icon: FileText, count: Math.min(notes.length, 5) },
    { id: "images", name: "С изображениями", icon: ImageIcon, count: notes.filter(n => n.images_count > 0).length }
  ];

  const getNotesForGroup = (id) => {
    if (id === "all") return notes;
    if (id === "favorites") return notes.filter(n => n.isFavorite);
    if (id === "recent") return notes.slice(0, 5);
    if (id === "images") return notes.filter(n => n.images_count > 0);
    return notes.filter(n => n.group === id);
  };

  const getColor = (name) => colors.find(c => c.name === name)?.light || colors[0].light;

  const getIcon = (name) => icons.find(i => i.name === name)?.icon || Folder;

  const toggleExpand = (id) => {
    setExpandedGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setEditingGroup(null);
    setShowCreateForm(false);
    setFormData({
      name: "",
      description: "",
      color: "indigo",
      icon: "Folder"
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    if (editingGroup) {
      await onGroupUpdate(editingGroup.id, formData);
    } else {
      await onGroupCreate(formData);
    }

    resetForm();
  };

  const startEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      color: group.color || "indigo",
      icon: group.icon || "Folder"
    });

    setShowCreateForm(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex">

      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className={`
        relative w-105 h-full overflow-y-auto
        ${themeClasses.colors.sidebar.bg}
        border-r ${themeClasses.colors.border.primary}
      `}>
        <div className="flex items-center justify-between p-4 border-b">

          <div className="flex items-center gap-3">

            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Folder className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
            </div>

            <div>
              <h2 className="font-semibold">Группы</h2>
              <p className="text-xs text-gray-500">
                {groups.length} групп
              </p>
            </div>

          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
          >
            <Plus className="w-4 h-4"/>
          </button>

        </div>


        <div className="p-4 space-y-6">
          {showCreateForm && (
            <form onSubmit={handleSubmit} className="space-y-3">

              <input
                value={formData.name}
                onChange={e => setFormData({...formData, name:e.target.value})}
                placeholder="Название"
                className="w-full px-3 py-2 rounded-lg border"
              />

              <textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description:e.target.value})}
                placeholder="Описание"
                className="w-full px-3 py-2 rounded-lg border"
              />

              <div className="flex gap-2 flex-wrap">
                {colors.map(c=>(
                  <button
                    key={c.name}
                    type="button"
                    onClick={()=>setFormData({...formData,color:c.name})}
                    className={`w-7 h-7 rounded-full ${c.class} ${
                      formData.color===c.name && "ring-2 ring-offset-2 ring-indigo-500"
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2">

                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 border rounded-lg"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  className="px-3 py-2 bg-indigo-500 text-white rounded-lg"
                >
                  Сохранить
                </button>

              </div>

            </form>
          )}
          <div>

            <p className="text-xs uppercase text-gray-500 mb-2">
              Системные
            </p>

            <div className="space-y-1">

              {systemGroups.map(group => {

                const Icon = group.icon;

                return (
                  <button
                    key={group.id}
                    onClick={()=>onGroupSelect(group.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      selectedGroupId===group.id && "bg-indigo-100 dark:bg-indigo-900/30"
                    }`}
                  >

                    <Icon className="w-4 h-4"/>

                    <span className="flex-1 text-left">
                      {group.name}
                    </span>

                    <span className="text-xs text-gray-500">
                      {group.count}
                    </span>

                  </button>
                );

              })}

            </div>

          </div>

          <div>

            <p className="text-xs uppercase text-gray-500 mb-2">
              Мои группы
            </p>

            <div className="space-y-2">

              {groups.map(group => {

                const Icon = getIcon(group.icon);
                const expanded = expandedGroups.includes(group.id);
                const notes = getNotesForGroup(group.id);

                return (

                  <div key={group.id}>

                    <div
                      onClick={()=>onGroupSelect(group.id)}
                      onDragOver={(e)=>{e.preventDefault();setDragOverGroup(group.id)}}
                      onDrop={(e)=>{
                        const noteId = e.dataTransfer.getData("note");
                        onMoveNoteToGroup(Number(noteId), group.id);
                        setDragOverGroup(null);
                      }}
                      className={`group flex items-center gap-2 p-2 rounded-lg border ${
                        dragOverGroup===group.id ? "ring-2 ring-indigo-500" : ""
                      } hover:bg-gray-50 dark:hover:bg-gray-800`}
                    >

                      <button
                        onClick={(e)=>{e.stopPropagation();toggleExpand(group.id)}}
                      >
                        {expanded ?
                          <ChevronDown className="w-4 h-4"/> :
                          <ChevronRight className="w-4 h-4"/>
                        }
                      </button>

                      <div className={`p-1.5 rounded ${getColor(group.color)}`}>
                        <Icon className="w-4 h-4"/>
                      </div>

                      <span className="flex-1 text-sm">
                        {group.name}
                      </span>

                      <span className="text-xs text-gray-500">
                        {notes.length}
                      </span>

                      <button
                        onClick={(e)=>{
                          e.stopPropagation();
                          setShowMenu(showMenu===group.id?null:group.id)
                        }}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4"/>
                      </button>

                    </div>


                    {expanded && (

                      <div className="ml-7 mt-1 space-y-1">

                        {notes.map(note=>(
                          <div
                            key={note.id}
                            draggable
                            onDragStart={(e)=>e.dataTransfer.setData("note",note.id)}
                            className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab"
                          >

                            <GripVertical className="w-3 h-3 text-gray-400"/>

                            <span className="truncate">
                              {note.title || "Без названия"}
                            </span>

                          </div>
                        ))}

                      </div>

                    )}

                  </div>

                );

              })}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}