I would like to build the following application. 

Sales one-pager builder called Handout

Purpose: A place where sales teams can easily build and edit sales onepager sites to send to prospects who ask for more information. 

Features: 


## Main App
The home of the app. It is where the user can manage their pages, see engagement metrics, edit users, and more. 

The main app should have a left sidebar with the following pages:

### Sites page
Searchable table of the Sites the user has, along with any team sites shared across the team. 

The header of the page should have a Create Site primary button in the top right.
- Clicking this should open a modal to name the site then once confirmed bring them to the new site in the editor. 

The number of sites the user is able to create should be determined by the plan their workspace is on. 

Basic: 1 total sites
Pro: 100 total sites

Each row should have:
- Name
- Status: Draft, Published, Archived
- Created at
- Updated at
- Created by user
- Whether this site is shared with the user or private
- More menu action dropdown with the following options
    - Duplicate
    - Publish / Unpublish (Depending on if it is draft or published)
        - Unpublish should show a confirmation dialog that tells the user this will unpublish the site and it will no longer be visible to visitors or receive tracking data.
    - Share (If published)
        - This lets you share the public link with others (usually prospects). 
        - This should pull up the sharing modal. 
        - The sharing modal should have a default link for the site. This should be handout.app/{workspace_username}/{site-slug}
        - The user should also be able to see and create and delete custom variants links so they can customize variables per recipient and track specific people/accounts who open the site. 
    - Variants
        - This should pull up the variants modal for the site. 
    - Team access
        - This should bring up the team sharing modal that lets the user select who on their team has access to the site. 
            - The user should be able to select specific users or select entire team to share it with the entire team (this includes any new users who might join later)
            - For each user / the entire team the user should be able to select what permissions to share (View & copy, edit, or none)
    - Archive
        - This should bring up a confirmation dialog that tells the user this will delete and unpublish the site if it is active and it will no longer be visible or receive tracking data.

### Tracking Page
Should show a searchable sortable feed of events showing:
- Icon corresponding to type of event
    - Types of events:
        - site viewed
        - Button clicked (for when a button on the site is clicked)
        - We may have other event types in the future like calendar booked
- Event name
- The site name
- What was clicked: The link name or button name or link if no name
- timestamp clicked at (e.g. 5h ago)

### Team Page
The team page should be where you can invite and manage users. 

User accounts should be either: Admin or User
- User accounts should also have a developer boolean for our dev team that gives them access to dev mode, but this is not accessible via the ui

Admin users should be able to delete and change the role of other users. Regular users should not be able to edit other user roles. 
- Users shouldn't be able to edit their own role or delete themselves

Any user can invite another user. 

Each user row should show:
- The user's avatar
- Their name
- Their email
- Their role
- A more menu button with options:
- Set role to admin / Set role to user (depending on what the user's role is)
    - Shows warning confirmation modal
- Delete user
    - Shows warning confirmation modal


## Variants Modal

       - All link strings should be editable. When typing (with debounce) it should check the database for uniqueness. If the link is already being used it should be invalid and not able to save. When saved, if editing an existing link it should show a warning confirmation dialog that informs the user that visitors won't be able to access it at the previous link.


## Editor

The site editor should. 

You can select a site style. There should be 2 styles to start:

One in this general style, where sections are separated by lines:


And one more like this style where sections are their own cards:
https://unti.framer.website/

Note: These aren't the exact styles we want, just to give you an idea of general layout. 

All different styles should be built on the same underlying bones and structure and tokens, just styled differently

Pages should have:

#### Header section (always)
- Avatar (the brand logo) 
    - Options: Single, Duo
        - Single is a single square avatar
        - Duo shows two square avatars, next to eachother with connecting lines to signify partnership
- Title
    - The page title
- Subtitle
    - Optional subtitle

#### Sections
- You can add sections to the page, drag to reorder them, and delete them
- Sections have an optional title you can click into to edit
- Inside each section you can add blocks like text, buttons, tables, etc like notion.    
    - We should support our own custom ui blocks here for things like testimonials section, logos section, etc. 
- We will probably want to use an editor component like tiptap dev or something similar. 
- The experience should feel very smooth, like notion.

The editor should have a sidebar where you can edit page settings, or when you have a specific block highlighted, configure options for that block. 

Page settings should include:
- Style
- Show table of contents
- Etc. 

In the header of the editor should be a publish button and a share button and a more menu icon button. 
- Publish button should open a publish dialog. Think through what should be here. Sharing should probably be part of this naturally. 
- Share button should open the same share dialog mentioned earlier, available when the status is published
- More menu icon button should show the other options aside from publish that are available in the pages list more menu mentioned earlier.


### Editor Block Types

#### Cal.com Embed
https://cal.com/docs/atoms/booker-embed#booker-embed
https://cal.com/docs/atoms/cal-oauth-provider

#### Calendly Embed
https://developer.calendly.com/how-to-display-the-scheduling-page-for-users-of-your-app

## Custom Links
The custom 

## Sign up







Stack:

Backend:
Node.JS, Postgres

Frontend:
React, Shadcn (Use shadcn skill), Vite, Tanstack.

Hosting: 
Wherever is easiest and cheapest for now and will let us scale well if needed. 

We will need a way to host user pages with sharable links.  

Auth:
BetterAuth: https://better-auth.com/

Skills to install and use:
Frontend Design: npx skills add https://github.com/anthropics/skills --skill frontend-design
Shadcn: npx skills add https://github.com/shadcn/ui --skill shadcn
React Best Practices: npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
Tiptap: npx skills add https://github.com/xiaolai/vmark --skill tiptap-dev
