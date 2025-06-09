// Rating utilities - inlined from rating-utils.js
// RANK COLORS
const RANK_COLORS = {
  cheater     : '#8B4513',    // < -999999999 (brown)
  newbie      : '#808080',    //   < 1200
  pupil       : '#008000',    // 1200 – 1399
  specialist  : '#03A89E',    // 1400 – 1599
  expert      : '#0000ff',    // 1600 – 1899
  candmaster  : '#a0a',       // 1900 – 2099
  master      : '#FF8C00',    // 2100 – 2299
  intmaster   : '#FF8C00',    // 2300 - 2399
  grandmaster : '#ff0000',    // 2400 – 2599
  intgrandmaster: '#ff0000',  // 2600 - 2999
  legend      : '#ff0000'     // >= 3000 (Legendary GM)
};

// RANK BANDS
const RANK_BANDS = [
  { y1: 0,    y2: 1200, color: RANK_COLORS.newbie },
  { y1: 1200, y2: 1400, color: RANK_COLORS.pupil },
  { y1: 1400, y2: 1600, color: RANK_COLORS.specialist },
  { y1: 1600, y2: 1900, color: RANK_COLORS.expert },
  { y1: 1900, y2: 2100, color: RANK_COLORS.candmaster },
  { y1: 2100, y2: 2300, color: RANK_COLORS.master },
  { y1: 2300, y2: 2400, color: RANK_COLORS.intmaster },
  { y1: 2400, y2: 2600, color: RANK_COLORS.grandmaster },
  { y1: 2600, y2: 3000, color: RANK_COLORS.intgrandmaster },
  { y1: 3000, y2: 5000, color: RANK_COLORS.legend } // y2 determined dynamically
];

// RANK CLASSES - Maps to Codeforces CSS classes
const RANK_CLASSES = {
  cheater     : 'user-cheater',
  newbie      : 'user-gray',
  pupil       : 'user-green',
  specialist  : 'user-cyan',
  expert      : 'user-blue',
  candmaster  : 'user-violet',
  master      : 'user-orange',
  intmaster   : 'user-orange',
  grandmaster : 'user-red',
  intgrandmaster: 'user-red',
  legend      : 'user-legendary'
};

/**
 * Get the color for a rating value
 */
function getRatingColor(rating) {
  if (rating < -999999999) return RANK_COLORS.cheater;
  for (const band of RANK_BANDS) {
    if (rating >= band.y1 && (band.y2 === undefined || rating < band.y2)) {
      return band.color;
    }
  }
  // Default fallback color (should never reach here)
  return RANK_COLORS.newbie;
}

/**
 * Get the rank name based on rating
 */
function getRankName(rating) {
  if (rating < -999999999) return "Cheater";
  if (rating < 1200) return "Newbie";
  if (rating < 1400) return "Pupil";
  if (rating < 1600) return "Specialist";
  if (rating < 1900) return "Expert";
  if (rating < 2100) return "Candidate Master";
  if (rating < 2300) return "Master";
  if (rating < 2400) return "International Master";
  if (rating < 2600) return "Grandmaster";
  if (rating < 3000) return "International Grandmaster";
  return "Legendary Grandmaster";
}

/**
 * Get the CSS class for a rating
 */
function getRatingClass(rating) {
  if (rating < -999999999) return RANK_CLASSES.cheater;
  if (rating < 1200) return RANK_CLASSES.newbie;
  if (rating < 1400) return RANK_CLASSES.pupil;
  if (rating < 1600) return RANK_CLASSES.specialist;
  if (rating < 1900) return RANK_CLASSES.expert;
  if (rating < 2100) return RANK_CLASSES.candmaster;
  if (rating < 2300) return RANK_CLASSES.master;
  if (rating < 2400) return RANK_CLASSES.intmaster;
  if (rating < 2600) return RANK_CLASSES.grandmaster;
  if (rating < 3000) return RANK_CLASSES.intgrandmaster;
  return RANK_CLASSES.legend;
}

/**
 * Combined function to get color, name, and CSS class for a rating
 */
function getRatingInfo(rating) {
  return {
    color: getRatingColor(rating),
    name: getRankName(rating),
    cssClass: getRatingClass(rating)
  };
}

// Global variables for RSHF ratings data
let rshfAllGroupsData = null;
let rshfSelectedGroupData = null; // Data for the currently selected group
let rshfDataFileTimestamp = null; // Timestamp from the data file itself
let currentSelectedGroupId = null;

// Global variable for the <ul> of the new "Recent Actions (Filtered)" box
let filteredBlogsListElement = null;
const FILTERED_BOX_ID = 'rshf-filtered-actions-box';

// Comment filtering: rank order for comparison
const RANK_ORDER = [
  "Cheater",
  "Newbie",
  "Pupil",
  "Specialist",
  "Expert",
  "Candidate Master",
  "Master",
  "International Master",
  "Grandmaster",
  "International Grandmaster",
  "Legendary Grandmaster"
];

// Main comment filtering function
function filterCommentsByRank(commentSettings) {
  // Helper: get rank index
  function getRankIndex(rank) {
    return RANK_ORDER.indexOf(rank);
  }

  // Helper: get assumed rating for a user
  function getAssumedRating(username, cfRating) {
    if (rshfSelectedGroupData && rshfSelectedGroupData[username]) {
      // In group
      if (commentSettings.groupAssumedRating === 'rshf') {
        return rshfSelectedGroupData[username][1];
      } else if (commentSettings.groupAssumedRating === 'official_cf' && cfRating !== undefined && cfRating !== null) {
        return cfRating;
      } else {
        return rshfSelectedGroupData[username][1];
      }
    } else {
      // Not in group
      if (commentSettings.nonMemberAssumedRating === 'newbie') {
        return 0; // Newbie
      } else if (commentSettings.nonMemberAssumedRating === 'official_cf' && cfRating !== undefined && cfRating !== null) {
        return cfRating;
      } else {
        return 0;
      }
    }
  }

  // For each .comment
  document.querySelectorAll('.comment').forEach(commentEl => {
    // Try to get username from .avatar .rated-user or .avatar a[title]
    let username = null;
    let cfRating = null;
    const avatarLink = commentEl.querySelector('.avatar .rated-user, .avatar a[title]');
    if (avatarLink) {
      // Username is always the last word in the title (e.g. "Newbie oaxplyn" or "Unrated, Conqueror_of_Dominater69")
      const title = avatarLink.getAttribute('title') || '';
      const match = title.match(/(?:\w+\s)?([\w-]+)$/);
      if (match) {
        username = match[1];
      }
      // Try to get CF rating from the class (user-*)
      const classList = avatarLink.classList;
      if (classList) {
        const rank = classList[1];
        if (rank === 'user-gray') cfRating = 0;
        else if (rank === 'user-green') cfRating = 1200;
        else if (rank === 'user-cyan') cfRating = 1400;
        else if (rank === 'user-blue') cfRating = 1600;
        else if (rank === 'user-violet') cfRating = 1900;
        else if (rank === 'user-orange') cfRating = 2100;
        else if (rank === 'user-red') cfRating = 2400;
        else if (rank === 'user-legendary') cfRating = 3000;
        else if (rank == 'user-4000') cfRating = 4000;
        else cfRating = 0;
      }
    }

    // If username not found, skip
    if (!username) return;
    // Get assumed rating and rank
    const assumedRating = getAssumedRating(username, cfRating);
    const userRank = getRankName(assumedRating);
    const userRankIdx = getRankIndex(userRank);
    const lowerboundIdx = getRankIndex(
      getRankNameForDropdownValue(commentSettings.rankLowerbound)
    );

    // Show or hide comment based on comparison
    const shownComment = commentEl.querySelector('.shown-comment');
    const hiddenComment = commentEl.querySelector('.hidden-comment');
    if (userRankIdx >= lowerboundIdx) {
      // Show
      if (shownComment) shownComment.style.display = '';
      if (hiddenComment) hiddenComment.style.display = 'none';
    } else {
      // Hide
      if (shownComment) shownComment.style.display = 'none';
      if (hiddenComment) hiddenComment.style.display = '';
    }
  });
}

// Blog Filtering: Remove blogs from recent actions if below threshold, move to filtered box
function filterBlogsByRank(blogSettings) {
  // Helper: get rank index
  function getRankIndex(rank) {
    return RANK_ORDER.indexOf(rank);
  }
  // Helper: get assumed rating for a user
  function getAssumedRating(username, cfRating) {
    if (rshfSelectedGroupData && rshfSelectedGroupData[username]) {
      // In group
      if (blogSettings.groupAssumedRating === 'rshf') {
        return rshfSelectedGroupData[username][1];
      } else if (blogSettings.groupAssumedRating === 'official_cf' && cfRating !== undefined && cfRating !== null) {
        return cfRating;
      } else {
        return rshfSelectedGroupData[username][1];
      }
    } else {
      // Not in group
      if (blogSettings.nonMemberAssumedRating === 'newbie') {
        return 0; // Newbie
      } else if (blogSettings.nonMemberAssumedRating === 'official_cf' && cfRating !== undefined && cfRating !== null) {
        return cfRating;
      } else {
        return 0;
      }
    }
  }

  // Find all recent blog action 
  if (!filteredBlogsListElement) {
    const existingFilteredBox = document.getElementById(FILTERED_BOX_ID);
    if (existingFilteredBox) {
        filteredBlogsListElement = existingFilteredBox.querySelector('.recent-actions ul');
    }
    // No warning here, as it's okay if no filtered box exists (e.g. no recent actions box at all)
  }

  // Find the original "Recent actions" list (ul element)
  let originalRecentActionsULElement = null;
  const sideboxes = document.querySelectorAll('.roundbox.sidebox');
  for (const box of sideboxes) {
    if (box.id === FILTERED_BOX_ID) continue; // Skip our filtered box

    const caption = box.querySelector('.caption.titled');
    if (caption && caption.textContent.trim().startsWith('→ Recent actions')) {
      originalRecentActionsULElement = box.querySelector('.recent-actions ul');
      break;
    }
  }

  if (!originalRecentActionsULElement) {
    // console.warn('RSHF: Original "Recent actions" list (ul) not found for filtering.');
    return;
  }

  // Iterate over a static copy of child nodes (LI elements), as we're modifying the list
  const blogEntryLIs = Array.from(originalRecentActionsULElement.children);

  blogEntryLIs.forEach(li => {
    if (!(li.tagName === 'LI')) return; // Process only LI elements
    const userLink = li.querySelector('a.rated-user');
    if (!userLink) return;
    // Username from link text or title
    let username = null;
    let cfRating = null;
    const title = userLink.getAttribute('title') || '';
    const match = title.match(/(?:[\w\s]+\s)?([\w.-]+)$/);
    if (match) {
      username = match[1];
    }
    // Map user class to rating leftbound
    const classList = userLink.classList;
    if (classList) {
      // Use same mapping as comment filtering
      const rankClass = Array.from(classList).find(cls => cls.startsWith('user-') && cls !== 'user-black' && cls !== 'rated-user');
      if (rankClass) {
        switch (rankClass) {
          case 'user-gray': cfRating = 1100; break;      // Newbie approx.
          case 'user-green': cfRating = 1300; break;     // Pupil approx.
          case 'user-cyan': cfRating = 1500; break;      // Specialist approx.
          case 'user-blue': cfRating = 1700; break;       // Expert approx.
          case 'user-violet': cfRating = 2000; break;    // CM approx.
          case 'user-orange': cfRating = 2200; break;    // Master/IM approx.
          case 'user-red': cfRating = 2500; break;        // GM+ approx.
          default: cfRating = undefined;
        }
      }
    }

    if (!username) return;

    const assumedRating = getAssumedRating(username, cfRating); // blogSettings is in scope
    const userRank = getRankName(assumedRating);
    const userRankIdx = getRankIndex(userRank);
    const lowerboundSetting = blogSettings.rankLowerbound || 'newbie'; // Ensure default
    const lowerboundIdx = getRankIndex(getRankNameForDropdownValue(lowerboundSetting));

    if (userRankIdx < lowerboundIdx && username !== 'atcoder_official' && username !== 'MikeMirzayanov' && username !== 'ICPCNews' && username !== 'luogu_official') {
      // Blog entry should be filtered
      if (filteredBlogsListElement) {
        filteredBlogsListElement.appendChild(li); // Move to the filtered list
      } else {
        li.remove(); // Fallback: remove if the filtered box isn't set up
      }
    }
  });
}

// Map dropdown value to rank name (for legacy or display)
function getRankNameForDropdownValue(val) {
  switch (val) {
    case 'cheater': return 'Cheater';
    case 'newbie': return 'Newbie';
    case 'pupil': return 'Pupil';
    case 'specialist': return 'Specialist';
    case 'expert': return 'Expert';
    case 'candmaster': return 'Candidate Master';
    case 'master': return 'Master';
    case 'intmaster': return 'International Master';
    case 'grandmaster': return 'Grandmaster';
    case 'intgrandmaster': return 'International Grandmaster';
    case 'legend': return 'Legendary Grandmaster';
    default: return 'Newbie';
  }
}

// Initialize content script
(function() {
  initializeExtension();
})();

// Function to set up the "Recent Actions (Filtered)" box
function setupFilteredBlogsBox() {
  // Check if the filtered box already exists
  if (document.getElementById(FILTERED_BOX_ID)) {
    const existingFilteredBox = document.getElementById(FILTERED_BOX_ID);
    filteredBlogsListElement = existingFilteredBox.querySelector('.recent-actions ul');
    return;
  }

  const sideboxes = document.querySelectorAll('.roundbox.sidebox');
  let originalRecentActionsBox = null;

  for (const box of sideboxes) {
    const caption = box.querySelector('.caption.titled');
    // Ensure it's the main recent actions box and not one we might create elsewhere
    if (caption && caption.textContent.trim().startsWith('→ Recent actions')) {
      originalRecentActionsBox = box;
      break;
    }
  }

  if (!originalRecentActionsBox) {
    // console.warn('RSHF: Original "Recent actions" box not found. Filtered box not created.');
    return;
  }

  // Clone the original box
  const filteredBox = originalRecentActionsBox.cloneNode(true);
  filteredBox.id = FILTERED_BOX_ID; // Assign an ID to the new box

  // Change the title
  const captionElement = filteredBox.querySelector('.caption.titled');
  if (captionElement) {
    let textNodeToChange = null;
    for (const child of captionElement.childNodes) {
        if (child.nodeType === Node.TEXT_NODE && child.nodeValue.includes('→ Recent actions')) {
            textNodeToChange = child;
            break;
        }
    }
    if (textNodeToChange) {
        textNodeToChange.nodeValue = textNodeToChange.nodeValue.replace('→ Recent actions', '→ Recent Actions (Filtered)');
    } else {
        // Fallback, might not be perfectly styled if arrow is separate
        captionElement.textContent = '→ Recent Actions (Filtered)'; 
        console.warn("RSHF: Could not precisely change title for filtered box. Used fallback.");
    }
  }

  // Get and clear the <ul> for filtered blogs
  const ulElement = filteredBox.querySelector('.recent-actions ul');
  if (ulElement) {
    ulElement.innerHTML = ''; // Clear any copied list items
    filteredBlogsListElement = ulElement;
  } else {
    console.warn('RSHF: Could not find <ul> in cloned filtered box. Creating one.');
    const recentActionsDiv = filteredBox.querySelector('.recent-actions');
    if(recentActionsDiv) {
        const newUl = document.createElement('ul');
        recentActionsDiv.innerHTML = ''; // Clear potential non-ul content
        recentActionsDiv.appendChild(newUl);
        filteredBlogsListElement = newUl;
    }
  }

  // Remove the "Detailed →" link from the new box
  const bottomLinks = filteredBox.querySelector('.bottom-links');
  if (bottomLinks) {
    bottomLinks.remove();
  }

  // Insert the new box after the original one
  originalRecentActionsBox.parentNode.insertBefore(filteredBox, originalRecentActionsBox.nextSibling);
}

// Main initialization function
async function initializeExtension() {
  if (!window.location.hostname.includes('codeforces.com')) {
    return;
  }

  // Get selected group from storage
  const localData = await new Promise(resolve => {
    chrome.storage.local.get([
      'selectedGroup',
      'rshfRatingsData',
      'rshfRatingsFileTimestamp',
      // Comment filtering settings:
      'commentGroupAssumedRating',
      'commentNonMemberAssumedRating',
      'commentRankLowerbound',
      // Blog filtering settings:
      'blogGroupAssumedRating',
      'blogNonMemberAssumedRating',
      'blogRankLowerbound'
    ], resolve);
  });

  if (!localData.selectedGroup || !localData.selectedGroup.group_id) {
    return;
  }
  currentSelectedGroupId = localData.selectedGroup.group_id;

  if (localData.rshfRatingsData) {
    rshfAllGroupsData = localData.rshfRatingsData;
    rshfDataFileTimestamp = localData.rshfRatingsFileTimestamp;
    if (currentSelectedGroupId && rshfAllGroupsData[currentSelectedGroupId]) {
      rshfSelectedGroupData = rshfAllGroupsData[currentSelectedGroupId];
    } else {
      console.warn(`RSHF: Selected group data for '${currentSelectedGroupId}' not found in local ratings file.`);
      rshfSelectedGroupData = {}; // Avoid errors, treat as empty group
    }
  } else {
    console.warn('RSHF: Ratings data not found in local storage. Please refresh data via popup.');
    rshfAllGroupsData = {};
    rshfSelectedGroupData = {};
  }

  const settings = await getStoredSettings();

  // --- Comment Filtering ---
  // Only filter comments on blog entry pages
  if (window.location.href.startsWith('https://codeforces.com/blog/entry')) {
    const commentSettings = {
        groupAssumedRating: localData.commentGroupAssumedRating || 'rshf',
        nonMemberAssumedRating: localData.commentNonMemberAssumedRating || 'official_cf',
        rankLowerbound: localData.commentRankLowerbound || 'newbie'
      };
    filterCommentsByRank(commentSettings);
  }

  // --- Blog Filtering Setup ---
  // This needs to be done only if there's a recent actions box on the page.
  // The setup function itself checks for the original box.
  setupFilteredBlogsBox();
  // --- Blog Filtering ---
  const blogSettings = {
    groupAssumedRating: localData.blogGroupAssumedRating || 'rshf',
    nonMemberAssumedRating: localData.blogNonMemberAssumedRating || 'official_cf',
    rankLowerbound: localData.blogRankLowerbound || 'newbie'
  };
  filterBlogsByRank(blogSettings);

  processPage(settings, localData.selectedGroup.group_name); // Pass group_name for display purposes
}

// Adds "View on RSHF" link to sidebar Pay attention box if present
function processSidebarContestBox() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  // Find all roundbox/sidebox elements
  const boxes = sidebar.querySelectorAll('.roundbox.sidebox');
  for (const box of boxes) {
    const caption = box.querySelector('.caption.titled');
    if (!caption) continue;
    if (/pay attention/i.test(caption.textContent)) {
      // Find the contest link in this box
      const contestLink = box.querySelector('a[href^="/contests/"]');
      if (!contestLink) continue;
      // Avoid duplicate
      if (contestLink.parentNode.querySelector('.rshf-view-link')) continue;
      // Try to extract contest ID from the link (e.g. /contests/2117)
      const match = contestLink.getAttribute('href').match(/\/(?:contests|contest)\/(\d+)/);
      if (!match) continue;
      const contestId = match[1];
      // Create the RSHF link
      const rshfLink = document.createElement('a');
      rshfLink.href = `https://rshf.net/contest/cf_${contestId}`;
      rshfLink.textContent = 'View on RSHF »';
      rshfLink.className = 'rshf-view-link';
      rshfLink.target = '_blank';
      rshfLink.style.display = 'block';
      rshfLink.style.margin = '0.2em 0 -1em 0';
      rshfLink.style.fontSize = '0.9em';
      contestLink.insertAdjacentElement('afterend', rshfLink);
      break; // Only one Pay attention box
    }
  }
}

// Process Codeforces page to replace ratings
async function processPage(settings, group_display_name) { // Added group_display_name
  const userElements = document.querySelectorAll(
    '.rated-user'
  );
  
  if (userElements.length === 0 || !rshfSelectedGroupData) {
    return; 
  }
  // No need to extract usernames or fetch, data is already loaded
  replaceRatings(userElements, settings);
  processProfileSidebar(settings, group_display_name);
  
  if (window.location.pathname.startsWith('/profile/')) {
    processProfileBox(settings, group_display_name);
    profilePageAdditions();
  }

  // Call sidebar contest box processing second last
  processSidebarContestBox();
  // Call contest page processing last

  if(window.location.pathname.startsWith('/contests')) {
    processContestPage();
  }
}


// Adds "View on RSHF" links to the past contests table and "Register (RSHF)" to upcoming contests on /contests
function processContestPage() {
  if (!window.location.href.startsWith('https://codeforces.com/contests')) return;

  // --- Past contests table ---
  const tables = Array.from(document.querySelectorAll('div.contests-table table, div.datatable table'));
  let pastTable = null;
  let upcomingTable = null;
  for (const table of tables) {
    // Heuristically: past table has 'Enter', upcoming/active has 'Register' or 'Before start'
    if (!pastTable && table.innerHTML.includes('Enter')) {
      pastTable = table;
    }
    // Heuristically: upcoming/active table has 'Register' or 'Before start' or 'Before registration'
    if (!upcomingTable && (table.innerHTML.includes('Register') || table.innerHTML.includes('Before start') || table.innerHTML.includes('Before registration'))) {
      upcomingTable = table;
    }
  }

  // For both past and upcoming/active contests, add "View on RSHF" below contest title (leftmost column)
  function addRshfLinksToTable(table) {
    const rows = table.querySelectorAll('tr[data-contestid]');
    rows.forEach(row => {
      const contestId = row.getAttribute('data-contestid');
      if (!contestId) return;
      const cells = row.querySelectorAll('td');
      if (cells.length === 0) return;
      const leftCell = cells[0];
      // Avoid duplicates
      if (leftCell.querySelector('.rshf-view-link')) return;
      // Find the contest title link (usually the first <a> in the cell)
      const titleLink = leftCell.querySelector('a');
      // Create the RSHF link
      const rshfLink = document.createElement('a');
      rshfLink.href = `https://rshf.net/contest/cf_${contestId}`;
      rshfLink.textContent = 'View on RSHF »';
      rshfLink.className = 'rshf-view-link';
      rshfLink.target = '_blank';
      rshfLink.style.display = 'inline-block';
      rshfLink.style.marginTop = '0';
      rshfLink.style.marginLeft = '0';
      rshfLink.style.fontSize = '0.8em';
      if (titleLink) {
        titleLink.insertAdjacentElement('afterend', rshfLink);
        titleLink.insertAdjacentElement('afterend', document.createElement('br'));
      } else {
        // Fallback: just append to cell
        leftCell.appendChild(document.createElement('br'));
        leftCell.appendChild(rshfLink);
      }
    });
  }
  if (pastTable) addRshfLinksToTable(pastTable);
  if (upcomingTable) addRshfLinksToTable(upcomingTable);

}


// Process profile sidebar to replace rating
async function processProfileSidebar(settings, group_display_name) {
  // Find the sidebar rating element robustly
  const sidebarLi = Array.from(document.querySelectorAll('.personal-sidebar ul.propertyLinks li')).find(li => li.textContent.includes('Rating:'));
  const sidebarRatingSpan = sidebarLi ? sidebarLi.querySelector('span[class^="user-"]') : null;
  const sidebarUserLink = document.querySelector('.personal-sidebar .for-avatar a.rated-user');

  if (!sidebarRatingSpan || !sidebarUserLink || !rshfSelectedGroupData) return;

  const username = sidebarUserLink.textContent.trim();
  const userData = rshfSelectedGroupData[username]; // Format: [cf_handle, rating]

  if (userData && userData[1] !== undefined && userData[1] !== null) {
    const rating = userData[1];
    const maxRating = userData[2];
    if (settings.inGroupDisplay === 'official_cf') {
      // Keep official CF rating
    } else {
      // Replace rating, color, class, and add tooltip
      removeRatingClasses(sidebarRatingSpan);
      const ratingInfo = getRatingInfo(rating);
      sidebarRatingSpan.textContent = rating;
      sidebarRatingSpan.classList.add(ratingInfo.cssClass);
      sidebarRatingSpan.style.color = ratingInfo.color;

    }
  } else {
    // Not in group: apply non-member styling
    switch (settings.nonMemberDisplay) {
      case 'transparent':
        sidebarUserLink.classList.add('rshf-non-member-transparent');
        sidebarRatingSpan.classList.add('rshf-non-member-transparent');
        break;
      case 'strike-through':
        // Apply strike-through class without changing colors or other styles
        // This matches the original behavior shown in the example
        sidebarUserLink.classList.add('rshf-strike-through');
        sidebarRatingSpan.classList.add('rshf-strike-through');
        break;
      case 'newbie':
        removeRatingClasses(sidebarRatingSpan);
        sidebarRatingSpan.classList.add(RANK_CLASSES.newbie);
        sidebarRatingSpan.style.color = RANK_COLORS.newbie;
        break;
      case 'plain':
      default:
        break;
    }
  }
}


// Process the profile box on the profile page
async function processProfileBox(settings, group_display_name) {
  const profileBox = document.querySelector('.info');
  if (!profileBox) return;
  
  // Find all the relevant elements
  const mainUserHandleElement = profileBox.querySelector('h1 a.rated-user');
  const userRankSpan = profileBox.querySelector('.user-rank span');
  const ratingLiElement = Array.from(profileBox.querySelectorAll('ul li')).find(li => 
    li.textContent.includes('Contest rating:'));
  const ratingSpanElement = ratingLiElement?.querySelector('span[class^="user-"]');
  
  if (!mainUserHandleElement) return;
  
  // Get the username
  const username = mainUserHandleElement.textContent.trim();
  
  // Only on /profile pages: fetch data from API
  if (window.location.pathname.startsWith('/profile/')) {
    
    // Remove any previous RSHF elements
    const existingRshfLi = profileBox.querySelector('.rshf-rating-li');
    if (existingRshfLi) existingRshfLi.remove();
    if (!rshfSelectedGroupData || !rshfSelectedGroupData[username]) {
        // User not found in memory data - apply non-member styling
        const maxRatingSpans = ratingLiElement?.querySelectorAll('.smaller span');
        //Apply class to non-group members according to settings, using no hardcoded values
        switch (settings.nonMemberDisplay) {
            case 'transparent':
              mainUserHandleElement.classList.add('rshf-non-member-transparent');
              if (userRankSpan) userRankSpan.classList.add('rshf-non-member-transparent');
              if (ratingSpanElement) ratingSpanElement.classList.add('rshf-non-member-transparent');
              // Also strike-through the max rating spans if present
              if (maxRatingSpans) maxRatingSpans.forEach(span => span.classList.add('rshf-non-member-transparent'));
              break;
            case 'strike-through':
              mainUserHandleElement.classList.add('rshf-strike-through');
              if (userRankSpan) userRankSpan.classList.add('rshf-strike-through');
              if (ratingSpanElement) ratingSpanElement.classList.add('rshf-strike-through');
              // Also strike-through the max rating spans if present
              if (maxRatingSpans) maxRatingSpans.forEach(span => span.classList.add('rshf-strike-through'));
              break;
            case 'newbie':
              removeRatingClasses(mainUserHandleElement);
              mainUserHandleElement.classList.add(RANK_CLASSES.newbie);
              if (userRankSpan) userRankSpan.classList.add(RANK_CLASSES.newbie);
              if (ratingSpanElement) ratingSpanElement.classList.add(RANK_CLASSES.newbie);
              // Also strike-through the max rating spans if present
              if (maxRatingSpans) maxRatingSpans.forEach(span => span.classList.add('user-gray'));
              break;
            case 'plain':
            default:
              break;
          }
          return;
        }
    
      const rating = rshfSelectedGroupData[username][1];
      const maxRating = rshfSelectedGroupData[username][2];
      const groupName = group_display_name;
      
      const ratingInfo = getRatingInfo(rating);

      if (settings.inGroupDisplay !== 'official_cf') {
        removeRatingClasses(userRankSpan);
        userRankSpan.textContent = ratingInfo.name;
        userRankSpan.classList.add(ratingInfo.cssClass);
        userRankSpan.style.color = ratingInfo.color;
      }
      
      // 4. Add a new list item for RSHF Rating (simple HTML matching the original example)
      let rshfLi = document.createElement('li');
      rshfLi.classList.add('rshf-rating-li');
      
      // Build HTML for RSHF Rating and add the RSHF profile symbol link ONLY after the max rating
      let rshfHtml = `
        <img style="vertical-align:middle;margin-right:0.5em; height:1.5em; width:1.5em;" src="${chrome.runtime.getURL('/images/logo_small.png')}">
        Group Rating [<a href="https://rshf.net/group/${groupName}" target="_blank">${groupName}</a>]: 
        <span style="font-weight:bold;" class="${ratingInfo.cssClass}">${rating}</span>
      `;
      
      // Add max rating if available - format exactly like the example
      const maxRatingInfo = getRatingInfo(maxRating);
      rshfHtml += ` <span class="smaller">(max. <span style="font-weight:bold;" class="${maxRatingInfo.cssClass}">${maxRatingInfo.name}, </span> <span style="font-weight:bold;" class="${maxRatingInfo.cssClass}">${maxRating}</span>)</span>`;
      // Add a single RSHF profile link as a bigger symbol after max rating
      rshfHtml += ` <a href="https://rshf.net/user/${username}" target="_blank" title="View RSHF profile" style="margin-left:0.5em; font-size:1em; vertical-align:middle; text-decoration:none; opacity:0.8; display:inline-block; line-height:1;">
        <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' style='vertical-align:middle;'><path fill='currentColor' d='M14 3v2h3.59L10 12.59l1.41 1.41L19 6.41V10h2V3z'/><path fill='currentColor' d='M5 5v14h14v-7h-2v5H7V7h5V5z' opacity='.5'/></svg>
      </a>`;
      
      rshfLi.innerHTML = rshfHtml;
      
      // Modify the CF rating label text
    //   if (ratingLiElement) {
    //     // Get all text nodes in the rating element
    //     const textNodes = Array.from(ratingLiElement.childNodes)
    //       .filter(node => node.nodeType === Node.TEXT_NODE);
        
    //     // Find the text node that contains "Contest rating:"
    //     const ratingTextNode = textNodes.find(node => 
    //       node.textContent.includes('Contest rating:'));
          
    //     if (ratingTextNode) {
    //       // Replace "Contest rating:" with "CF Rating:"
    //       ratingTextNode.textContent = ratingTextNode.textContent.replace(
    //         'Contest rating:', 'CF Rating:');
    //     }
    //   }
      
      // Insert before the contest rating li
      if (ratingLiElement && ratingLiElement.parentNode) {
        ratingLiElement.parentNode.insertBefore(rshfLi, ratingLiElement);
      } else if (profileBox.querySelector('ul')) {
        profileBox.querySelector('ul').appendChild(rshfLi);
      }
    return;
  }
  return;
}

// Replace ratings in the DOM elements
function replaceRatings(elements, settings) {
  if (!rshfSelectedGroupData) {
    console.warn("RSHF: No selected group data available for replacing ratings.");
    return;
  }

  elements.forEach(element => {
    // First clear any existing non-member styling
    element.style.opacity = '';
    
    const username = element.textContent.trim();
    const userData = rshfSelectedGroupData[username]; // Format: [cf_handle, rating]

    if (userData && userData[1] !== undefined && userData[1] !== null) {
      // User is in the group
      const rating = userData[1];
      const maxRating = userData[2];
      if (settings.inGroupDisplay === 'official_cf') {
        // Keep official CF rating
      } else {
        updateElementWithNewRating(element, rating, maxRating);
      }
    } else {
      // User is not in the group
      handleNonGroupMember(element, settings.nonMemberDisplay);
    }
  });
}

// Update element with new rating information
function updateElementWithNewRating(element, rating, maxRating = null) {
  removeRatingClasses(element);
  const ratingInfo = getRatingInfo(rating);
  element.classList.add(ratingInfo.cssClass);
  element.style.color = ratingInfo.color;


}

// Handle elements for users not in the selected group
function handleNonGroupMember(element, displayMode) {
  switch (displayMode) {
    case 'transparent':
      element.style.opacity = '0.5';
      break;
    case 'strike-through':
      // Make sure we're applying strike-through consistently
      element.classList.add('rshf-strike-through');
      // For rated users, maintain their original color but with strike-through
      // This ensures we match the original styling behavior
      break;
    case 'newbie':
      removeRatingClasses(element);
      element.classList.add(RANK_CLASSES.newbie);
      element.style.color = RANK_COLORS.newbie;
      break;
    case ':holyf:':
      // Avoid duplicating the image if already present
      if (!element.nextSibling || !(element.nextSibling.classList && element.nextSibling.classList.contains('rshf-holyf-img'))) {
        const img = document.createElement('img');
        img.src = chrome.runtime.getURL('assets/holyf.png');
        img.alt = ':holyf:';
        img.className = 'rshf-holyf-img';
        img.style.height = '1.3em';
        img.style.width = 'auto';
        img.style.verticalAlign = 'middle';
        img.style.marginLeft = '2px';
        element.parentNode.insertBefore(img, element.nextSibling);
      }
      break;
    case ':holyf:+':
      // Avoid duplicating the image if already present
      if (!element.nextSibling || !(element.nextSibling.classList && element.nextSibling.classList.contains('rshf-holyf-img'))) {
        const img = document.createElement('img');
        img.src = chrome.runtime.getURL('assets/holyf.png');
        img.alt = ':holyf:+';
        img.className = 'rshf-holyf-img';
        img.style.height = '1.5em';
        img.style.width = 'auto';
        img.style.verticalAlign = 'middle';
        img.style.marginLeft = '2px';
        // Randomly choose clockwise or counterclockwise spin
        const isCw = Math.random() < 0.5;
        img.style.animation = (isCw ? 'rshf-rotate' : 'rshf-rotate-ccw') + ' 1.2s linear infinite';
        element.parentNode.insertBefore(img, element.nextSibling);
      }
      break;
    case 'plain':
    default:
      break;
  }
}

// --- Profile Page Additions: Problem-Rating Histogram -----------------------
async function profilePageAdditions() {

  // Extract username from profile URL
  function getProfileUsername() {
    const m = window.location.pathname.match(/\/profile\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  // Get color for a rating (from your rating utils)
  function ratingColor(r) {
    if (r < 1200) return RANK_COLORS.newbie;
    if (r < 1400) return RANK_COLORS.pupil;
    if (r < 1600) return RANK_COLORS.specialist;
    if (r < 1900) return RANK_COLORS.expert;
    if (r < 2100) return RANK_COLORS.candmaster;
    if (r < 2300) return RANK_COLORS.master;
    if (r < 2400) return RANK_COLORS.intmaster;
    if (r < 2600) return RANK_COLORS.grandmaster;
    if (r < 3000) return RANK_COLORS.intgrandmaster;
    return RANK_COLORS.legend;
  }

  // Fetch all solves for a user
  async function fetchSolves(handle) {
    try {
      const resp = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`);
      const data = await resp.json();
      if (data.status !== 'OK' || !Array.isArray(data.result)) return [];
      return data.result;
    } catch { return []; }
  }

  // Create and insert the chart container below the heatmap
  function insertChartContainer(fromDateValue = '', beforeDateValue = '') {
    const box = document.createElement('div');
    box.className = 'roundbox userActivityRoundBox borderTopRound borderBottomRound';
    box.id = 'rshf-profile-rating-histogram';
    box.style.marginTop = '20px';
    box.innerHTML = `
      <div class="_UserActivityFrame_header" style="display: flex; align-items: center; justify-content: space-between;">
        <div></div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <label style="font-size:0.98em;">From: <input type="date" id="rshf-hist-from-date" value="${fromDateValue}" style="font-size:1em;"></label>
          <label style="font-size:0.98em;">Before: <input type="date" id="rshf-hist-before-date" value="${beforeDateValue}" style="font-size:1em;"></label>
        </div>
      </div>
      <div style="width:100%;height:320px;">
        <canvas id="rshf-rating-bar-chart" style="max-width:100%;max-height:320px;"></canvas>
      </div>`;
    const heatmap = document.getElementById('userActivityGraph');
    if (heatmap && heatmap.parentNode) {
      heatmap.parentNode.parentNode.insertBefore(box, heatmap.parentNode.nextSibling);
    } else {
      document.body.appendChild(box);
    }
    return box;
  }

  // Main logic
  const username = getProfileUsername();
  if (!username) return;
  // Remove any previous chart
  const old = document.getElementById('rshf-profile-rating-histogram');
  if (old) old.remove();

  // Date filter state
  let fromDate = '';
  let beforeDate = '';
  if (window.rshf_hist_date_state) {
    fromDate = window.rshf_hist_date_state.fromDate;
    beforeDate = window.rshf_hist_date_state.beforeDate;
  }

  // Insert chart container with filter selectors
  insertChartContainer(fromDate, beforeDate);

  // Fetch solves and aggregate by rating, deduplicating problems efficiently
  const submissions = await fetchSolves(username);
  const seenProblems = new Set(); // 'contestId-index' as key
  const ratingCounts = new Map();
  const dedupedSubmissions = [];
  for (const sub of submissions) {
    if (sub.verdict === 'OK' && sub.problem && typeof sub.problem.rating === 'number') {
      // Filter by date range if set
      if (fromDate) {
        const subDate = new Date(sub.creationTimeSeconds * 1000);
        if (subDate < new Date(fromDate)) continue;
      }
      if (beforeDate) {
        const subDate = new Date(sub.creationTimeSeconds * 1000);
        if (subDate >= new Date(beforeDate)) continue;
      }
      const key = sub.problem.contestId + '-' + sub.problem.index;
      if (!seenProblems.has(key)) {
        seenProblems.add(key);
        dedupedSubmissions.push(sub);
      }
    }
  }
  dedupedSubmissions.forEach(sub => {
    const r = sub.problem.rating;
    if (r >= 800 && r <= 3500) {
      ratingCounts.set(r, (ratingCounts.get(r) || 0) + 1);
    }
  });
  if (ratingCounts.size === 0) return;

  // Prepare chart data

  // Add event listeners for date filters
  setTimeout(() => {
    const fromInput = document.getElementById('rshf-hist-from-date');
    const beforeInput = document.getElementById('rshf-hist-before-date');
    if (fromInput && beforeInput) {
      fromInput.addEventListener('change', e => {
        window.rshf_hist_date_state = {
          fromDate: fromInput.value,
          beforeDate: beforeInput.value
        };
        profilePageAdditions();
      });
      beforeInput.addEventListener('change', e => {
        window.rshf_hist_date_state = {
          fromDate: fromInput.value,
          beforeDate: beforeInput.value
        };
        profilePageAdditions();
      });
    }
  }, 50);

  const labels = Array.from(ratingCounts.keys()).sort((a,b)=>a-b);
  const data = labels.map(r => ratingCounts.get(r));

  // Hardcoded color logic for histogram bars
  function getBarColor(rating) {
    if (rating >= 2300 && rating < 2400) return 'rgba(235, 153, 52, 0.76)'; // darker orange
    if (rating >= 3000 && rating <= 3500) return 'rgba(228, 18, 18, 0.75)'; // darker red
    // fallback to ratingColor util
    return hexToRgba(ratingColor(rating), 0.5);
  }
  let bgColors = labels.map(getBarColor);

  // Map to store problems for each rating
const ratingToProblems = new Map();
submissions.forEach(sub => {
  if (sub.verdict === 'OK' && sub.problem && typeof sub.problem.rating === 'number') {
    const r = sub.problem.rating;
    if (r >= 800 && r <= 3500) {
      ratingCounts.set(r, (ratingCounts.get(r) || 0) + 1);
      if (!ratingToProblems.has(r)) ratingToProblems.set(r, []);
      // Problem code: contestId + index (e.g. 1234A)
      const code = sub.problem.contestId + sub.problem.index;
      const url = `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`;
      ratingToProblems.get(r).push({ code, url });
    }
  }
});

// Function to convert hex to rgba with alpha
function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}


// Insert chart container
// insertChartContainer();
// Add problem list container below chart
let listDiv = document.getElementById('rshf-profile-rating-problems');
if (!listDiv) {
  listDiv = document.createElement('div');
  listDiv.id = 'rshf-profile-rating-problems';
  listDiv.style.margin = '16px 0 0 0';
  listDiv.style.fontSize = '1em';
  const chartBox = document.getElementById('rshf-profile-rating-histogram');
  chartBox.appendChild(listDiv);
}
listDiv.innerHTML = '';

const ctx = document.getElementById('rshf-rating-bar-chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels,
    datasets: [{
      label: 'Problems Solved',
      data,
      backgroundColor: bgColors,
      borderColor: '#333',
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `Solved: ${ctx.parsed.y} (Rating: ${ctx.label})`
        }
      }
    },
    onClick: (evt, elements) => {
      if (!elements.length) return;
      const idx = elements[0].index;
      const rating = labels[idx];
      const problems = ratingToProblems.get(rating) || [];
      if (problems.length === 0) {
        listDiv.innerHTML = `<em>No problems found for rating ${rating}.</em>`;
        return;
      }
      listDiv.innerHTML = `<b>${rating} rated problems solved:</b> ` +
        problems.map(p => `<a href="${p.url}" target="_blank" style="margin-right:6px;">${p.code}</a>`).join(', ');
      // Scroll to listDiv
    //   listDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },
  scales: {
    x: {
      title: { display: true, text: 'Problem Rating' },
      ticks: { autoSkip: false, font: { size: 12 } }
    },
    y: {
      title: { display: true, text: 'Problems Solved' },
      beginAtZero: true,
      precision: 0
    }
  }
});
}
  
// Remove Codeforces rating classes from element
function removeRatingClasses(element) {
  const ratingClasses = [
    'user-black', 'user-gray', 'user-green', 'user-cyan', 
    'user-blue', 'user-violet', 'user-orange', 'user-red',
    'user-legendary', 'user-legendary-user'
  ];
  
  ratingClasses.forEach(className => {
    element.classList.remove(className);
  });
}

async function getStoredSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(['nonMemberDisplay', 'inGroupDisplay', 'selectedGroup'], result => {
      resolve({
        nonMemberDisplay: result.nonMemberDisplay || 'newbie', // Default to Gray
        inGroupDisplay: result.inGroupDisplay || 'rshf' // Default to RSHF ratings
      });
    });
  });
}
