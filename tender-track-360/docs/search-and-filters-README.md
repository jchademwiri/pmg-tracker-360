# Search and Filters Implementation

This implementation provides comprehensive search and filtering functionality for members and invitations in the organization dashboard.

## Components

### 1. SearchAndFilters Component

The main component that provides the search input and filter controls.

```tsx
import { SearchAndFilters } from '@/components/search-and-filters';

<SearchAndFilters
  onFiltersChange={(filters) => console.log(filters)}
  placeholder="Search members and invitations..."
  showRoleFilter={true}
  showStatusFilter={true}
/>;
```

**Props:**

- `onFiltersChange`: Callback function called when filters change
- `placeholder`: Placeholder text for search input (optional)
- `showRoleFilter`: Whether to show role filter dropdown (optional, default: true)
- `showStatusFilter`: Whether to show status filter dropdown (optional, default: true)
- `className`: Additional CSS classes (optional)

**Features:**

- Real-time search input with debouncing
- Role-based filtering (owner, admin, member)
- Status-based filtering (active, pending, expired, inactive)
- Active filter indicators with badges
- Clear filters functionality
- Individual filter removal

### 2. Filter Utilities

Utility functions for filtering data and managing filter state.

```tsx
import { filterMembers, filterInvitations } from '@/lib/filter-utils';

const filteredMembers = filterMembers(members, filters);
const filteredInvitations = filterInvitations(invitations, filters);
```

**Available Functions:**

- `filterMembers(members, filters)`: Filters member array based on criteria
- `filterInvitations(invitations, filters)`: Filters invitation array based on criteria
- `getInvitationDisplayStatus(invitation)`: Gets display status for invitation
- `hasActiveFilters(filters)`: Checks if any filters are active
- `getFilterSummary(filters)`: Gets summary of active filters
- `getNoResultsMessage(filters, type)`: Gets appropriate no results message

### 3. useSearchAndFilter Hook

Custom hook that combines search and filtering logic.

```tsx
import { useSearchAndFilter } from '@/hooks/use-search-and-filter';

const {
  filters,
  setFilters,
  filteredMembers,
  filteredInvitations,
  hasActiveFilters,
  totalResults,
  noResultsMessage,
  clearFilters,
} = useSearchAndFilter({ members, invitations });
```

### 4. NoResults Component

Reusable component for displaying "no results" states.

```tsx
import { NoResults } from '@/components/no-results';

<NoResults
  title="No results found"
  message="No members found matching your criteria."
  actionLabel="Invite First Member"
  onAction={() => console.log('Action clicked')}
  icon="search"
/>;
```

### 5. MembersAndInvitationsWithSearch Component

Complete example component that demonstrates the full implementation.

```tsx
import { MembersAndInvitationsWithSearch } from '@/components/members-and-invitations-with-search';

<MembersAndInvitationsWithSearch
  members={members}
  invitations={invitations}
  onInviteMember={() => console.log('Invite member')}
  onMemberAction={(id, action) => console.log('Member action', id, action)}
  onInvitationAction={(id, action) =>
    console.log('Invitation action', id, action)
  }
/>;
```

## Filter State Interface

```tsx
interface FilterState {
  search: string;
  role: Role | 'all';
  status: 'all' | 'active' | 'pending' | 'expired' | 'inactive';
}
```

## Data Interfaces

### Member Interface

```tsx
interface MemberWithUser extends Member {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  status?: 'active' | 'inactive';
  joinedAt?: Date;
}
```

### Invitation Interface

```tsx
interface PendingInvitation {
  id: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: Date;
  invitedAt: Date;
  inviterName: string;
}
```

## Usage Examples

### Basic Search and Filter

```tsx
function MyComponent() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: 'all',
    status: 'all',
  });

  const filteredMembers = filterMembers(members, filters);

  return (
    <div>
      <SearchAndFilters onFiltersChange={setFilters} />
      {/* Render filtered results */}
    </div>
  );
}
```

### Using the Hook

```tsx
function MyComponent({ members, invitations }) {
  const {
    filteredMembers,
    filteredInvitations,
    hasActiveFilters,
    noResultsMessage,
    setFilters,
  } = useSearchAndFilter({ members, invitations });

  return (
    <div>
      <SearchAndFilters onFiltersChange={setFilters} />

      {filteredMembers.length === 0 && filteredInvitations.length === 0 ? (
        <NoResults message={noResultsMessage} />
      ) : (
        <>{/* Render filtered members and invitations */}</>
      )}
    </div>
  );
}
```

## Features Implemented

✅ **Real-time search functionality**

- Searches member names and emails
- Searches invitation emails and inviter names
- Case-insensitive matching

✅ **Role-based filtering**

- Filter by owner, admin, member roles
- "All Roles" option to show everything

✅ **Status-based filtering**

- Filter by active, pending, expired, inactive status
- Automatic expiry detection for invitations

✅ **Active filter indicators**

- Badge display of active filters
- Individual filter removal
- Clear all filters functionality

✅ **No results states**

- Context-aware messages
- Different messages for filtered vs unfiltered states
- Call-to-action buttons when appropriate

✅ **Responsive design**

- Mobile-first approach
- Proper responsive breakpoints
- Touch-friendly interactions

✅ **Accessibility**

- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility

## Testing

The implementation includes comprehensive tests:

- **Component tests**: Testing SearchAndFilters component behavior
- **Utility tests**: Testing filter functions and edge cases
- **Integration tests**: Testing the complete filtering workflow

Run tests with:

```bash
npm test -- --testPathPattern="search-and-filters|filter-utils"
```

## Requirements Satisfied

This implementation satisfies all requirements from task 5:

- ✅ **6.1**: Real-time search functionality for members and invitations
- ✅ **6.2**: Role-based filtering using existing role types
- ✅ **6.3**: Status-based filtering (active, pending, etc.)
- ✅ **6.4**: Clear filters functionality and active filter indicators using Badge components
- ✅ **6.5**: "No results" state for filtered views

The implementation uses shadcn/ui components (Input, Select, Badge) as specified and provides a complete, reusable solution for search and filtering functionality.
