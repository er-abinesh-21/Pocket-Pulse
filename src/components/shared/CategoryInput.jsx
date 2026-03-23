import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, X } from 'lucide-react';
import { EXPENSE_CATEGORIES_DATA, CATEGORY_GROUPS, GROUP_ICONS, getCategoryIcon } from '../../constants/categories';

/**
 * CategoryInput Component
 * Smart input for category selection with grouped display and emoji icons
 */
export const CategoryInput = ({
    value,
    onChange,
    categories = [],
    onAddCategory,
    placeholder = 'Select category',
    className = '',
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddNew, setShowAddNew] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const dropdownRef = useRef(null);

    // Build lookup map for icons (includes both default and custom categories)
    const getIcon = (categoryName) => {
        return getCategoryIcon(categoryName);
    };

    // Filter categories based on search
    const filteredCategories = categories.filter(cat =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group filtered categories
    const getGroupedFiltered = () => {
        const grouped = {};

        filteredCategories.forEach(catName => {
            const catData = EXPENSE_CATEGORIES_DATA.find(c => c.name === catName);
            const group = catData ? catData.group : 'Custom';

            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(catName);
        });

        // Sort groups by defined order, with Custom at the end
        const orderedGroups = [];
        CATEGORY_GROUPS.forEach(group => {
            if (grouped[group]) {
                orderedGroups.push({ name: group, items: grouped[group] });
            }
        });
        if (grouped['Custom']) {
            orderedGroups.push({ name: 'Custom', items: grouped['Custom'] });
        }

        return orderedGroups;
    };

    // Check if search term is a new category
    const isNewCategory = searchTerm &&
        !categories.some(cat => cat.toLowerCase() === searchTerm.toLowerCase());

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setShowAddNew(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectCategory = (category) => {
        onChange(category);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleAddNewCategory = async () => {
        const categoryName = newCategoryName.trim() || searchTerm.trim();
        if (!categoryName) return;

        if (categories.some(cat => cat.toLowerCase() === categoryName.toLowerCase())) {
            alert('This category already exists!');
            return;
        }

        if (onAddCategory) {
            await onAddCategory(categoryName);
            onChange(categoryName);
            setShowAddNew(false);
            setNewCategoryName('');
            setSearchTerm('');
            setIsOpen(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && isNewCategory && !showAddNew) {
            e.preventDefault();
            setShowAddNew(true);
            setNewCategoryName(searchTerm);
        }
    };

    const toggleGroup = (groupName) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const groupedFiltered = isOpen ? getGroupedFiltered() : [];

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Selected Value / Trigger */}
            <div
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer flex items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? 'flex items-center gap-2' : 'text-gray-400'}>
                    {value ? (
                        <>
                            <span className="text-lg">{getIcon(value)}</span>
                            <span>{value}</span>
                        </>
                    ) : (
                        placeholder
                    )}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-72 overflow-hidden flex flex-col">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search categories..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            autoFocus
                        />
                    </div>

                    {/* Grouped Category List */}
                    <div className="overflow-y-auto flex-1">
                        {groupedFiltered.length > 0 ? (
                            groupedFiltered.map((group) => (
                                <div key={group.name}>
                                    {/* Group Header */}
                                    <button
                                        onClick={() => toggleGroup(group.name)}
                                        className="w-full px-3 py-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors sticky top-0"
                                    >
                                        <ChevronRight
                                            className={`w-3 h-3 transition-transform ${collapsedGroups[group.name] ? '' : 'rotate-90'}`}
                                        />
                                        <span>{GROUP_ICONS[group.name] || '📁'}</span>
                                        <span>{group.name}</span>
                                        <span className="ml-auto text-[10px] font-normal text-gray-400">
                                            {group.items.length}
                                        </span>
                                    </button>

                                    {/* Group Items */}
                                    {!collapsedGroups[group.name] && (
                                        group.items.map((categoryName) => (
                                            <button
                                                key={categoryName}
                                                onClick={() => handleSelectCategory(categoryName)}
                                                className={`w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm ${
                                                    value === categoryName
                                                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                                        : 'text-gray-900 dark:text-white'
                                                }`}
                                            >
                                                <span className="text-base w-6 text-center flex-shrink-0">{getIcon(categoryName)}</span>
                                                <span>{categoryName}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            ))
                        ) : searchTerm ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                No categories found
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                Start typing to search
                            </div>
                        )}
                    </div>

                    {/* Add New Category Option */}
                    {isNewCategory && !showAddNew && (
                        <button
                            onClick={() => {
                                setShowAddNew(true);
                                setNewCategoryName(searchTerm);
                            }}
                            className="w-full px-4 py-3 text-left border-t border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center space-x-2 text-purple-600 dark:text-purple-400 font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add "{searchTerm}" as new category</span>
                        </button>
                    )}

                    {/* Add New Category Form */}
                    {showAddNew && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <div className="flex items-center space-x-2 mb-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Category name"
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddNewCategory();
                                        }
                                    }}
                                    autoFocus
                                />
                                <button
                                    onClick={() => {
                                        setShowAddNew(false);
                                        setNewCategoryName('');
                                    }}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                    title="Cancel"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                            <button
                                onClick={handleAddNewCategory}
                                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create Category</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategoryInput;
