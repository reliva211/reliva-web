# Series and Books Pages TODO

## Search Clearing Functionality

When implementing the series and books pages, make sure to include the same search clearing functionality as implemented in the movies page:

### Key Functionality to Implement:

1. **Collection Selection Handler**:
   ```typescript
   const handleCollectionSelect = (collectionId: string) => {
     setSelectedCollection(collectionId);
     // Clear search when clicking on collection tabs
     setSearchQuery("");
     setSearchResults([]);
     setIsSearching(false);
     setIsGenreSearching(false);
   };
   ```

2. **Collection Tabs**:
   - Use `handleCollectionSelect(collection.id)` in the onClick handler
   - This ensures search is cleared when navigating between collections

3. **Default Collections**:

   **For Series**:
   ```typescript
   const defaultCollections = [
     { name: "All Series", isDefault: true, color: "bg-blue-500" },
     { name: "Watched", isDefault: true, color: "bg-green-500" },
     { name: "Watching", isDefault: true, color: "bg-yellow-500" },
     { name: "Watchlist", isDefault: true, color: "bg-purple-500" },
     { name: "Dropped", isDefault: true, color: "bg-red-500" },
   ];
   ```

   **For Books**:
   ```typescript
   const defaultCollections = [
     { name: "All Books", isDefault: true, color: "bg-blue-500" },
     { name: "Read", isDefault: true, color: "bg-green-500" },
     { name: "Reading", isDefault: true, color: "bg-yellow-500" },
     { name: "Completed", isDefault: true, color: "bg-purple-500" },
     { name: "To Read", isDefault: true, color: "bg-orange-500" },
     { name: "Dropped", isDefault: true, color: "bg-red-500" },
   ];
   ```

4. **Firebase Collections**:
   - **Series**: `users/{uid}/seriesCollections` and `users/{uid}/series`
   - **Books**: `users/{uid}/bookCollections` and `users/{uid}/books`

5. **Search APIs**:
   - **Series**: Use TMDB TV search API
   - **Books**: Use Google Books API

6. **UI Components**:
   - Same dropdown functionality for add/remove
   - Same grid/list view toggle
   - Same search and filter controls

### Implementation Order:
1. Series page (similar to movies but with TV API)
2. Books page (with Google Books API)

### Key Features to Maintain:
- ✅ Search clearing when clicking collection tabs
- ✅ Dropdown menus for add/remove actions
- ✅ Real-time Firebase updates
- ✅ Collection management (create custom collections)
- ✅ Grid/List view toggle
- ✅ Sorting and filtering options 