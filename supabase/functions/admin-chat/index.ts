import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to call AI with retry logic for rate limits
async function callAIWithRetry(
  apiKey: string,
  body: any,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // If successful or non-retryable error, return immediately
      if (response.ok || (response.status !== 429 && response.status !== 503)) {
        return response;
      }

      // Rate limit or service unavailable - wait and retry
      if (response.status === 429 || response.status === 503) {
        const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Rate limited (attempt ${attempt + 1}/${maxRetries}), waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error: any) {
      lastError = error;
      const delay = initialDelay * Math.pow(2, attempt);
      console.error(`API call failed (attempt ${attempt + 1}/${maxRetries}):`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  throw lastError || new Error('Max retries exceeded for AI API call');
}

// Helper function to format error messages for users
function formatErrorMessage(error: string): string {
  if (error.includes("Could not find a relationship")) {
    return "Unable to fetch related data. Please try again.";
  }
  if (error.includes("violates row-level security")) {
    return "You don't have permission to perform this action.";
  }
  if (error.includes("duplicate key")) {
    return "This item already exists.";
  }
  if (error.includes("not found")) {
    return "The requested item was not found.";
  }
  return error.length > 100 ? error.substring(0, 100) + '...' : error;
}

// Helper function to generate readable summaries for tool results
function generateToolSummary(toolName: string, args: any, result: any): string {
  if (!result.success) {
    return `⚠️ ${formatErrorMessage(result.error || 'Unknown error')}`;
  }

  const data = result.data;
  
  switch (toolName) {
    case "create_reservation":
      return `✅ Created reservation **${data.confirmation_number}** for ${data.guests?.first_name || ''} ${data.guests?.last_name || ''}\n- Check-in: ${args.check_in_date}\n- Check-out: ${args.check_out_date}\n- ${data.nights} nights @ ৳${data.rate_per_night}/night\n- Total: ৳${data.total_amount}`;
    
    case "update_reservation":
      return `✅ Updated reservation **${data.confirmation_number}**\n- Status: ${data.status}`;
    
    case "cancel_reservation":
      return `✅ Cancelled reservation **${data.confirmation_number}**`;
    
    case "check_in_guest":
      return `✅ Successfully checked in **${data.guests?.first_name || ''} ${data.guests?.last_name || ''}**\n- Confirmation: ${data.confirmation_number}\n- Folio: ${data.folio_number}`;
    
    case "check_out_guest":
      return `✅ Successfully checked out **${data.guests?.first_name || ''} ${data.guests?.last_name || ''}**\n- Confirmation: ${data.confirmation_number}`;
    
    case "create_guest":
      return `✅ Created guest profile for **${data.first_name} ${data.last_name}**${data.is_vip ? ' ⭐VIP' : ''}\n- ID: ${data.id}`;
    
    case "update_guest":
      return `✅ Updated guest profile for **${data.first_name} ${data.last_name}**`;
    
    case "delete_guest":
      return `✅ Deleted guest profile`;
    
    case "toggle_guest_vip":
      return `✅ Guest VIP status updated to: **${data.is_vip ? 'VIP ⭐' : 'Regular'}**`;
    
    case "toggle_guest_blacklist":
      return `✅ Guest ${data.is_blacklisted ? 'added to blacklist ⛔' : 'removed from blacklist'}`;
    
    case "create_room": {
      let msg = `✅ Created room **${data.room_number}** (${data.room_types?.name || 'N/A'})`;
      if (result.renamed) {
        msg += `\n⚠️ ${result.renamed}`;
      }
      return msg;
    }
    
    case "update_room":
      return `✅ Updated room **${data.room_number}**`;
    
    case "delete_room":
      return `✅ Deleted room`;
    
    case "update_room_status":
      return `✅ Updated room status to **${data.status}**`;
    
    case "create_room_type": {
      let msg = `✅ Created room type **${data.name}** (${data.code})\n- Rate: ৳${data.base_rate}/night\n- Max occupancy: ${data.max_occupancy}`;
      if (result.renamed) {
        msg += `\n⚠️ ${result.renamed}`;
      }
      return msg;
    }
    
    case "update_room_type":
      return `✅ Updated room type **${data.name}**`;
    
    case "delete_room_type":
      return `✅ Deleted room type`;
    
    case "create_housekeeping_task":
      return `✅ Created ${data.task_type} task for room **${data.rooms?.room_number || 'N/A'}**\n- Priority: ${data.priority}\n- Status: ${data.status}`;
    
    case "update_housekeeping_task":
      return `✅ Updated housekeeping task\n- Status: ${data.status}`;
    
    case "complete_housekeeping_task":
      return `✅ Completed housekeeping task for room **${data.rooms?.room_number || 'N/A'}**`;
    
    case "assign_housekeeping_task":
      return `✅ Assigned housekeeping task to staff`;
    
    case "create_maintenance_ticket":
      return `✅ Created maintenance ticket: **${data.title}**${data.rooms ? `\n- Room: ${data.rooms.room_number}` : ''}\n- Priority: ${data.priority}`;
    
    case "update_maintenance_ticket":
      return `✅ Updated maintenance ticket\n- Status: ${data.status}`;
    
    case "resolve_maintenance_ticket":
      return `✅ Resolved maintenance ticket: **${data.title}**`;
    
    case "assign_maintenance_ticket":
      return `✅ Assigned maintenance ticket to staff`;
    
    case "add_folio_charge":
      return `✅ Added charge to folio\n- ${data.description}: ৳${data.total_price}`;
    
    case "void_folio_charge":
      return `✅ Voided folio charge: ${data.description}`;
    
    case "close_folio":
      return `✅ Closed folio **${data.folio_number}**`;
    
    case "record_payment":
      return `✅ Recorded payment of **৳${data.amount}** via ${data.payment_method.replace('_', ' ')}`;
    
    case "void_payment":
      return `✅ Voided payment of ৳${data.amount}`;
    
    case "run_night_audit":
      return `✅ Night audit completed for ${data.business_date}\n- Occupancy: ${Math.round(data.occupancy_rate)}%\n- Rooms charged: ${data.rooms_charged}`;
    
    case "create_pos_outlet":
      return `✅ Created POS outlet **${data.name}** (${data.code})\n- Type: ${data.type}`;
    
    case "update_pos_outlet":
      return `✅ Updated POS outlet **${data.name}**`;
    
    case "create_pos_order":
      return `✅ Created order **${data.order_number}**\n- Items: ${data.items?.length || 0}\n- Total: ৳${data.total_amount}`;
    
    case "update_pos_order_status":
      return `✅ Updated order status to **${data.status}**`;
    
    case "cancel_pos_order":
      return `✅ Cancelled order **${data.order_number}**`;
    
    case "create_pos_item":
      return `✅ Created menu item **${data.name}** - ৳${data.price}`;
    
    case "update_pos_item":
      return `✅ Updated menu item **${data.name}**`;
    
    case "delete_pos_item":
      return `✅ Deleted menu item`;
    
    case "create_pos_category":
      return `✅ Created menu category **${data.name}**`;
    
    case "create_corporate_account":
      return `✅ Created corporate account **${data.company_name}** (${data.account_code})`;
    
    case "update_corporate_account":
      return `✅ Updated corporate account **${data.company_name}**`;
    
    case "delete_corporate_account":
      return `✅ Deleted corporate account`;
    
    case "get_dashboard_stats":
      return `📊 **Current Status:**\n- Occupancy: ${data.occupancy_rate}% (${data.occupied_rooms}/${data.total_rooms} rooms)\n- Today's arrivals: ${data.todays_arrivals}\n- Today's departures: ${data.todays_departures}\n- In-house guests: ${data.in_house_guests}`;
    
    case "search_guests":
      if (!data || data.length === 0) return "No guests found matching your search.";
      return `Found ${data.length} guest(s):\n${data.slice(0, 5).map((g: any) => `- ${g.first_name} ${g.last_name}${g.is_vip ? ' ⭐' : ''}${g.is_blacklisted ? ' ⛔' : ''} (${g.email || g.phone || 'No contact'})`).join('\n')}`;
    
    case "get_rooms":
      if (!data || data.length === 0) return "No rooms found.";
      const roomsByStatus = data.reduce((acc: any, r: any) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {});
      return `📊 **${data.length} rooms:**\n${Object.entries(roomsByStatus).map(([s, c]) => `- ${s}: ${c}`).join('\n')}`;
    
    case "get_room_types":
      if (!data || data.length === 0) return "No room types configured.";
      return `Available room types:\n${data.map((rt: any) => `- **${rt.name}** (${rt.code}): ৳${rt.base_rate}/night, max ${rt.max_occupancy} guests`).join('\n')}`;
    
    case "get_todays_arrivals":
      if (!data || data.length === 0) return "No arrivals scheduled for today.";
      return `📥 **${data.length} arrival(s) today:**\n${data.map((r: any) => `- ${r.guests?.first_name} ${r.guests?.last_name}${r.guests?.is_vip ? ' ⭐' : ''} (${r.confirmation_number})`).join('\n')}`;
    
    case "get_todays_departures":
      if (!data || data.length === 0) return "No departures scheduled for today.";
      return `📤 **${data.length} departure(s) today:**\n${data.map((r: any) => `- ${r.guests?.first_name} ${r.guests?.last_name} (${r.confirmation_number})`).join('\n')}`;
    
    case "get_housekeeping_tasks":
      if (!data || data.length === 0) return "No housekeeping tasks found.";
      return `🧹 **${data.length} task(s):**\n${data.slice(0, 5).map((t: any) => `- Room ${t.rooms?.room_number}: ${t.task_type} (${t.status})`).join('\n')}`;
    
    case "get_maintenance_tickets":
      if (!data || data.length === 0) return "No maintenance tickets found.";
      return `🔧 **${data.length} ticket(s):**\n${data.slice(0, 5).map((t: any) => `- ${t.title} (${t.status})${t.rooms ? ` - Room ${t.rooms.room_number}` : ''}`).join('\n')}`;
    
    case "get_staff_list":
      if (!data || data.length === 0) return "No staff members found.";
      return `👥 **${data.length} staff member(s):**\n${data.map((s: any) => `- ${s.full_name} (${s.user_roles?.map((r: any) => r.role).join(', ') || 'No role'})${s.is_active ? '' : ' [Inactive]'}`).join('\n')}`;
    
    case "create_staff":
      return `✅ Created staff account for **${data.fullName || args.full_name}**\n- Username: ${data.username || args.username}\n- Role(s): ${(args.roles || []).join(', ')}\n- Password change required: ${args.must_change_password !== false ? 'Yes' : 'No'}`;
    
    case "delete_staff":
      return `✅ Deleted staff member`;
    
    case "deactivate_staff":
      return `✅ Deactivated staff member`;
    
    case "activate_staff":
      return `✅ Activated staff member`;
    
    case "update_staff_roles":
      return `✅ Updated staff roles to: ${args.roles?.join(', ')}`;
    
    case "search_reservations":
      if (!data || data.length === 0) return "No reservations found.";
      return `📋 **${data.length} reservation(s):**\n${data.slice(0, 5).map((r: any) => `- ${r.confirmation_number}: ${r.guests?.first_name} ${r.guests?.last_name} (${r.status})`).join('\n')}`;
    
    case "get_folios":
      if (!data || data.length === 0) return "No folios found.";
      return `💳 **${data.length} folio(s):**\n${data.slice(0, 5).map((f: any) => `- ${f.folio_number}: ${f.guests?.first_name} ${f.guests?.last_name} - ৳${f.balance} balance`).join('\n')}`;
    
    case "get_folio_details":
      return `📄 **Folio ${data.folio_number}**\n- Guest: ${data.guests?.first_name} ${data.guests?.last_name}\n- Total: ৳${data.total_amount}\n- Paid: ৳${data.paid_amount}\n- Balance: ৳${data.balance}\n- Items: ${data.folio_items?.length || 0}`;
    
    case "get_corporate_accounts":
      if (!data || data.length === 0) return "No corporate accounts found.";
      return `🏢 **${data.length} account(s):**\n${data.map((a: any) => `- ${a.company_name} (${a.account_code}) - ${a.discount_percentage}% discount`).join('\n')}`;
    
    case "get_revenue_report":
      return `💰 **Revenue Report (${data.start_date} to ${data.end_date}):**\n- Room Revenue: ৳${data.room_revenue}\n- F&B Revenue: ৳${data.fb_revenue}\n- Other Revenue: ৳${data.other_revenue}\n- **Total: ৳${data.total_revenue}**`;
    
    case "get_occupancy_report":
      return `📊 **Occupancy Report:**\n- Period: ${data.start_date} to ${data.end_date}\n- Total Rooms: ${data.total_rooms}\n- Reservations: ${data.total_reservations}`;
    
    case "update_property_settings":
      return `✅ Updated property settings`;
    
    case "get_audit_logs":
      if (!data || data.length === 0) return "No audit logs found.";
      return `📋 **${data.length} recent activities:**\n${data.slice(0, 5).map((l: any) => `- ${l.action} (${l.entity_type || 'system'})`).join('\n')}`;
    
    // ==================== BULK OPERATION SUMMARIES ====================
    case "bulk_create_rooms":
      if (!data || data.length === 0) return "⚠️ No rooms were created.";
      return `✅ **Bulk Created ${data.length} rooms:**\n${data.map((r: any) => `- Room ${r.room_number} (${r.room_types?.name || 'N/A'})`).join('\n')}`;
    
    case "bulk_create_guests":
      if (!data || data.length === 0) return "⚠️ No guests were created.";
      return `✅ **Bulk Created ${data.length} guests:**\n${data.map((g: any) => `- ${g.first_name} ${g.last_name}${g.is_vip ? ' ⭐' : ''} (ID: ${g.id})`).join('\n')}`;
    
    case "bulk_create_reservations_with_checkin":
      if (!result.reservations || result.reservations.length === 0) return "⚠️ No reservations were created.";
      const checkedInCount = result.checked_in?.length || 0;
      return `✅ **Bulk Created ${result.reservations.length} reservations, ${checkedInCount} checked in:**\n${result.reservations.map((r: any) => `- ${r.confirmation_number}: ${r.guests?.first_name} ${r.guests?.last_name} (${r.check_in_date} to ${r.check_out_date})`).join('\n')}`;
    
    default:
      return `✅ Action completed successfully.`;
  }
}

// Fetch comprehensive hotel context
async function getHotelContext(supabase: any, tenantId: string): Promise<string> {
  try {
    // Fetch all rooms with room types
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, room_number, floor, status, room_types(name, code, base_rate)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('room_number');
    
    // Fetch active staff profiles (separate queries to avoid FK issues)
    const { data: staffProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, is_active')
      .eq('tenant_id', tenantId);
    
    // Fetch roles for these staff
    const staffIds = staffProfiles?.map((s: any) => s.id) || [];
    let staffRoles: any[] = [];
    if (staffIds.length > 0) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', staffIds);
      staffRoles = roles || [];
    }
    
    // Combine staff with their roles
    const staff = (staffProfiles || []).map((profile: any) => ({
      ...profile,
      user_roles: staffRoles.filter((r: any) => r.user_id === profile.id)
    }));
    
    // Fetch recent guests
    const { data: guests } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email, phone, is_vip, is_blacklisted')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })
      .limit(100);
    
    // Fetch room types
    const { data: roomTypes } = await supabase
      .from('room_types')
      .select('id, name, code, base_rate, max_occupancy')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    
    // Fetch today's key info
    const today = new Date().toISOString().split('T')[0];
    const { data: arrivals } = await supabase
      .from('reservations')
      .select('id, confirmation_number, guests(first_name, last_name, is_vip)')
      .eq('tenant_id', tenantId)
      .eq('check_in_date', today)
      .eq('status', 'confirmed');
    
    const { data: departures } = await supabase
      .from('reservations')
      .select('id, confirmation_number, guests(first_name, last_name)')
      .eq('tenant_id', tenantId)
      .eq('check_out_date', today)
      .eq('status', 'checked_in');
    
    const { data: inHouse } = await supabase
      .from('reservations')
      .select('id, confirmation_number, guests(first_name, last_name), reservation_rooms(room_id, rooms(room_number))')
      .eq('tenant_id', tenantId)
      .eq('status', 'checked_in');

    // Fetch open folios
    const { data: openFolios } = await supabase
      .from('folios')
      .select('id, folio_number, balance, guests(first_name, last_name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'open')
      .limit(20);

    // Fetch pending housekeeping
    const { data: pendingHousekeeping } = await supabase
      .from('housekeeping_tasks')
      .select('id, task_type, priority, rooms(room_number)')
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'in_progress'])
      .limit(10);

    // Fetch open maintenance
    const { data: openMaintenance } = await supabase
      .from('maintenance_tickets')
      .select('id, title, priority, status, rooms(room_number)')
      .eq('tenant_id', tenantId)
      .in('status', ['open', 'in_progress'])
      .limit(10);

    // Fetch POS outlets
    const { data: posOutlets } = await supabase
      .from('pos_outlets')
      .select('id, name, code, type')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    // Build context string
    let context = `\n\n=== CURRENT HOTEL KNOWLEDGE ===\n\n`;
    
    context += `📅 TODAY: ${today}\n\n`;
    
    // Room Types
    context += `🏷️ ROOM TYPES (${roomTypes?.length || 0}):\n`;
    if (roomTypes && roomTypes.length > 0) {
      roomTypes.forEach((rt: any) => {
        context += `  - ${rt.name} (${rt.code}): ৳${rt.base_rate}/night, max ${rt.max_occupancy} guests, ID: ${rt.id}\n`;
      });
    } else {
      context += `  No room types configured\n`;
    }
    
    // Rooms with IDs
    context += `\n🚪 ROOMS (${rooms?.length || 0}):\n`;
    if (rooms && rooms.length > 0) {
      const roomsByStatus: any = {};
      rooms.forEach((r: any) => {
        roomsByStatus[r.status] = roomsByStatus[r.status] || [];
        roomsByStatus[r.status].push(r);
      });
      
      Object.keys(roomsByStatus).forEach(status => {
        context += `  ${status.toUpperCase()} (${roomsByStatus[status].length}):\n`;
        roomsByStatus[status].forEach((r: any) => {
          context += `    - Room ${r.room_number} (${r.room_types?.name || 'N/A'}), ID: ${r.id}\n`;
        });
      });
    } else {
      context += `  No rooms configured\n`;
    }
    
    // Staff
    context += `\n👥 STAFF (${staff?.length || 0}):\n`;
    if (staff && staff.length > 0) {
      staff.forEach((s: any) => {
        const roles = s.user_roles?.map((r: any) => r.role).join(', ') || 'No role';
        context += `  - ${s.full_name} [${roles}]${s.is_active ? '' : ' [INACTIVE]'}: ID: ${s.id}\n`;
      });
    } else {
      context += `  No staff configured\n`;
    }
    
    // Recent Guests
    context += `\n👤 RECENT GUESTS (showing ${Math.min(guests?.length || 0, 30)}):\n`;
    if (guests && guests.length > 0) {
      guests.slice(0, 30).forEach((g: any) => {
        context += `  - ${g.first_name} ${g.last_name}${g.is_vip ? ' ⭐VIP' : ''}${g.is_blacklisted ? ' ⛔BLACKLISTED' : ''}: ${g.email || g.phone || 'No contact'}, ID: ${g.id}\n`;
      });
    } else {
      context += `  No guests in database\n`;
    }
    
    // Today's Activity
    context += `\n📥 TODAY'S ARRIVALS (${arrivals?.length || 0}):\n`;
    if (arrivals && arrivals.length > 0) {
      arrivals.forEach((a: any) => {
        context += `  - ${a.guests?.first_name} ${a.guests?.last_name}${a.guests?.is_vip ? ' ⭐' : ''}: ${a.confirmation_number}, Reservation ID: ${a.id}\n`;
      });
    } else {
      context += `  No arrivals today\n`;
    }
    
    context += `\n📤 TODAY'S DEPARTURES (${departures?.length || 0}):\n`;
    if (departures && departures.length > 0) {
      departures.forEach((d: any) => {
        context += `  - ${d.guests?.first_name} ${d.guests?.last_name}: ${d.confirmation_number}, Reservation ID: ${d.id}\n`;
      });
    } else {
      context += `  No departures today\n`;
    }
    
    context += `\n🏨 IN-HOUSE GUESTS (${inHouse?.length || 0}):\n`;
    if (inHouse && inHouse.length > 0) {
      inHouse.forEach((ih: any) => {
        const roomNum = ih.reservation_rooms?.[0]?.rooms?.room_number || 'Unassigned';
        context += `  - ${ih.guests?.first_name} ${ih.guests?.last_name} in Room ${roomNum}: ${ih.confirmation_number}, Reservation ID: ${ih.id}\n`;
      });
    } else {
      context += `  No in-house guests\n`;
    }

    // Open Folios
    context += `\n💳 OPEN FOLIOS (${openFolios?.length || 0}):\n`;
    if (openFolios && openFolios.length > 0) {
      openFolios.forEach((f: any) => {
        context += `  - ${f.folio_number}: ${f.guests?.first_name} ${f.guests?.last_name}, Balance: ৳${f.balance}, ID: ${f.id}\n`;
      });
    } else {
      context += `  No open folios\n`;
    }

    // Pending Housekeeping
    context += `\n🧹 PENDING HOUSEKEEPING (${pendingHousekeeping?.length || 0}):\n`;
    if (pendingHousekeeping && pendingHousekeeping.length > 0) {
      pendingHousekeeping.forEach((h: any) => {
        context += `  - Room ${h.rooms?.room_number}: ${h.task_type} (P${h.priority}), ID: ${h.id}\n`;
      });
    }

    // Open Maintenance
    context += `\n🔧 OPEN MAINTENANCE (${openMaintenance?.length || 0}):\n`;
    if (openMaintenance && openMaintenance.length > 0) {
      openMaintenance.forEach((m: any) => {
        context += `  - ${m.title}${m.rooms ? ` (Room ${m.rooms.room_number})` : ''}: ${m.status}, P${m.priority}, ID: ${m.id}\n`;
      });
    }

    // POS Outlets
    context += `\n🍽️ POS OUTLETS (${posOutlets?.length || 0}):\n`;
    if (posOutlets && posOutlets.length > 0) {
      posOutlets.forEach((o: any) => {
        context += `  - ${o.name} (${o.code}): ${o.type}, ID: ${o.id}\n`;
      });
    }
    
    context += `\n=== END HOTEL KNOWLEDGE ===\n`;
    
    return context;
  } catch (error) {
    console.error('Error fetching hotel context:', error);
    return '\n\n[Could not fetch hotel context]\n';
  }
}

// System prompt for the chatbot
const baseSystemPrompt = `You are "Sakhi" (সখী), a POWERFUL hotel management AI assistant with FULL CONTROL over all hotel operations.

PERSONALITY:
- Warm, professional, and highly capable
- Use simple, clear language
- Occasionally use Bengali greetings like "নমস্কার" (Nomoshkar), "ধন্যবাদ" (Dhonnobad), "আচ্ছা" (Accha)
- Confirm destructive actions (delete, cancel, void) before executing
- Proactively suggest helpful actions

═══════════════════════════════════════════════════════════════════════════════
CRITICAL ANTI-HALLUCINATION RULES - YOU MUST FOLLOW THESE EXACTLY:
═══════════════════════════════════════════════════════════════════════════════

1. **NEVER claim to have performed ANY action without ACTUALLY calling a tool**
   - If a user asks you to CREATE something, you MUST call the appropriate tool
   - If a user asks you to UPDATE something, you MUST call the appropriate tool
   - If a user asks you to DELETE something, you MUST call the appropriate tool
   - You CANNOT create, update, or delete ANYTHING without calling a tool
   - Database changes ONLY happen when you call tools - there is NO other way

2. **MANDATORY TOOL CALLS FOR ACTIONS:**
   - "Create a room" → MUST call create_room(room_number, room_type_id)
   - "Delete a room" → MUST call delete_room(room_id)
   - "Create reservation" → MUST call create_reservation(...)
   - "Cancel reservation" → MUST call cancel_reservation(reservation_id)
   - "Create guest" → MUST call create_guest(first_name, last_name)
   - "Update guest" → MUST call update_guest(guest_id, ...)
   - "Delete guest" → MUST call delete_guest(guest_id)
   - "Check in guest" → MUST call check_in_guest(reservation_id)
   - "Check out guest" → MUST call check_out_guest(reservation_id)
   - "Create staff/employee" → MUST call create_staff(username, password, full_name, roles[])
   - "Delete staff" → MUST call delete_staff(user_id)
   - "Add charge" → MUST call add_folio_charge(folio_id, item_type, description, amount)
   - "Void charge" → MUST call void_folio_charge(folio_item_id, reason)
   - "Record payment" → MUST call record_payment(folio_id, amount, payment_method)
   - "Create housekeeping task" → MUST call create_housekeeping_task(room_id, task_type)
   - "Complete task" → MUST call complete_housekeeping_task(task_id)
   - "Create maintenance ticket" → MUST call create_maintenance_ticket(title, description)
   - "Resolve ticket" → MUST call resolve_maintenance_ticket(ticket_id, resolution_notes)

3. **BEFORE creating/updating/deleting anything:**
   - First, gather ALL required information from the user
   - Ask clarifying questions if any required field is missing
   - For destructive actions (delete, cancel, void), confirm with the user first

4. **AFTER attempting an action:**
   - Only report SUCCESS if the tool returned success: true
   - If tool returned success: false, report the error and suggest alternatives
   - Include specific details from the tool response (confirmation numbers, IDs, amounts)

5. **ABSOLUTELY FORBIDDEN:**
   - Saying "I have created/updated/deleted..." without a tool call
   - Fabricating confirmation numbers, IDs, or any data
   - Pretending an action succeeded when no tool was called
   - Making up room numbers, guest names, or any details not from context

═══════════════════════════════════════════════════════════════════════════════
BULK OPERATIONS BEHAVIOR - IMPORTANT:
═══════════════════════════════════════════════════════════════════════════════

When the user requests multiple items be created, updated, or deleted:

1. **USE BULK TOOLS when available:**
   - bulk_create_rooms for creating multiple rooms at once
   - bulk_create_guests for creating multiple guests at once
   - bulk_create_reservations_with_checkin for mock data with check-ins

2. **FOR SEQUENTIAL TASKS:**
   If you need to create guests, then reservations, then check-ins:
   - Call ALL guest creation tools first
   - Then call ALL reservation tools  
   - Then call ALL check-in tools
   - Do this in ONE response with multiple tool calls

3. **NO PARTIAL EXECUTION - COMPLETE THE ENTIRE REQUEST:**
   - When user says "create 10 rooms", create ALL 10 rooms
   - When user says "create 5 guests and 5 reservations", do ALL of it
   - Do NOT ask for confirmation between steps
   - Only summarize at the END after all operations complete

4. **MOCK DATA GENERATION:**
   When asked to create mock/test/sample data, generate realistic:
   - Bengali names for local hotels (e.g., Rahim Ahmed, Fatima Begum, Karim Hossain)
   - +880 phone numbers (e.g., +8801712345678)
   - @gmail.com emails based on names
   - Realistic check-in/out dates starting from today
   - Room numbers in sequence (101, 102, 103...)
   - Floor assignment based on room number first digit

5. **NEVER STOP HALFWAY:**
   - If user asks for 15 rooms, 10 guests, 10 reservations with check-in:
     - First: Create room types if needed
     - Then: Create all 15 rooms using bulk_create_rooms
     - Then: Create all 10 guests using bulk_create_guests  
     - Then: Create all 10 reservations with check-in using bulk_create_reservations_with_checkin
   - Complete EVERYTHING before responding with summary

═══════════════════════════════════════════════════════════════════════════════

FULL CONTROL CAPABILITIES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 GUEST MANAGEMENT:
- create_guest, update_guest, delete_guest, search_guests
- toggle_guest_vip (make VIP or regular)
- toggle_guest_blacklist (block/unblock guests)
- bulk_create_guests (create multiple guests at once)

🛏️ ROOM MANAGEMENT:
- create_room, update_room, delete_room, get_rooms
- update_room_status (vacant/occupied/dirty/maintenance/out_of_order)
- create_room_type, update_room_type, delete_room_type
- bulk_create_rooms (create multiple rooms at once)

📅 RESERVATIONS:
- create_reservation, update_reservation, cancel_reservation
- check_in_guest, check_out_guest
- search_reservations, get_todays_arrivals, get_todays_departures
- bulk_create_reservations_with_checkin (create multiple with auto check-in)

💳 FOLIOS & PAYMENTS:
- get_folios, get_folio_details
- add_folio_charge, void_folio_charge
- record_payment, void_payment
- close_folio

🧹 HOUSEKEEPING:
- create_housekeeping_task, update_housekeeping_task
- complete_housekeeping_task, assign_housekeeping_task
- get_housekeeping_tasks

🔧 MAINTENANCE:
- create_maintenance_ticket, update_maintenance_ticket
- resolve_maintenance_ticket, assign_maintenance_ticket
- get_maintenance_tickets

👥 STAFF MANAGEMENT:
- get_staff_list, create_staff
- delete_staff, deactivate_staff, activate_staff
- update_staff_roles

🍽️ POS & RESTAURANT:
- get_pos_outlets, create_pos_outlet, update_pos_outlet
- create_pos_item, update_pos_item, delete_pos_item
- create_pos_category
- create_pos_order, update_pos_order_status, cancel_pos_order
- get_pos_orders

🏢 CORPORATE ACCOUNTS:
- create_corporate_account, update_corporate_account, delete_corporate_account
- get_corporate_accounts

📊 REPORTS & ANALYTICS:
- get_dashboard_stats
- get_revenue_report
- get_occupancy_report
- get_audit_logs

⚙️ SYSTEM:
- run_night_audit, get_night_audit_status
- update_property_settings

RESPONSE STYLE:
- After executing ANY tool/action, provide a clear summary with specifics
- Use bullet points for multiple items
- Format amounts with ৳ for BDT
- Use markdown formatting for clarity
- Be proactive in suggesting next steps

IMPORTANT RULES:
- Always verify guest/room details before major actions
- Ask for confirmation on destructive operations (delete, void, cancel)
- If unsure about any parameter, ASK FIRST before calling any tool
- Never expose sensitive data unnecessarily
- Use the current date for relative dates like "today"
- When IDs are needed, find them from the context provided

CONTEXT:
- Current date: ${new Date().toISOString().split('T')[0]}
- You have FULL ADMINISTRATIVE ACCESS to this hotel`;

// Tool definitions for administrative actions
const tools = [
  // ==================== DASHBOARD & STATS ====================
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "Get current dashboard statistics including occupancy, arrivals, departures, and revenue",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },

  // ==================== GUEST MANAGEMENT ====================
  {
    type: "function",
    function: {
      name: "search_guests",
      description: "Search for guests by name, email, or phone number",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (name, email, or phone)" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_guest",
      description: "Create a new guest profile",
      parameters: {
        type: "object",
        properties: {
          first_name: { type: "string", description: "Guest's first name" },
          last_name: { type: "string", description: "Guest's last name" },
          email: { type: "string", description: "Guest's email address" },
          phone: { type: "string", description: "Guest's phone number" },
          nationality: { type: "string", description: "Guest's nationality" },
          id_type: { type: "string", description: "ID type (passport, nid, driving_license)" },
          id_number: { type: "string", description: "ID number" },
          is_vip: { type: "boolean", description: "Whether the guest is VIP" },
          address: { type: "string", description: "Guest's address" },
          city: { type: "string", description: "Guest's city" },
          country: { type: "string", description: "Guest's country" }
        },
        required: ["first_name", "last_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_guest",
      description: "Update an existing guest's information",
      parameters: {
        type: "object",
        properties: {
          guest_id: { type: "string", description: "Guest UUID" },
          first_name: { type: "string", description: "Guest's first name" },
          last_name: { type: "string", description: "Guest's last name" },
          email: { type: "string", description: "Guest's email address" },
          phone: { type: "string", description: "Guest's phone number" },
          nationality: { type: "string", description: "Guest's nationality" },
          id_type: { type: "string", description: "ID type" },
          id_number: { type: "string", description: "ID number" },
          address: { type: "string", description: "Guest's address" },
          city: { type: "string", description: "Guest's city" },
          country: { type: "string", description: "Guest's country" },
          notes: { type: "string", description: "Notes about the guest" }
        },
        required: ["guest_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_guest",
      description: "Delete a guest profile (only if no reservations exist)",
      parameters: {
        type: "object",
        properties: {
          guest_id: { type: "string", description: "Guest UUID to delete" }
        },
        required: ["guest_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "toggle_guest_vip",
      description: "Toggle VIP status for a guest",
      parameters: {
        type: "object",
        properties: {
          guest_id: { type: "string", description: "Guest UUID" },
          is_vip: { type: "boolean", description: "Set VIP status (true/false)" }
        },
        required: ["guest_id", "is_vip"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "toggle_guest_blacklist",
      description: "Add or remove a guest from blacklist",
      parameters: {
        type: "object",
        properties: {
          guest_id: { type: "string", description: "Guest UUID" },
          is_blacklisted: { type: "boolean", description: "Set blacklist status" },
          reason: { type: "string", description: "Reason for blacklisting" }
        },
        required: ["guest_id", "is_blacklisted"]
      }
    }
  },

  // ==================== ROOM TYPE MANAGEMENT ====================
  {
    type: "function",
    function: {
      name: "get_room_types",
      description: "Get available room types with their rates and details",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "create_room_type",
      description: "Create a new room type category",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Room type name (e.g., Deluxe, Suite)" },
          code: { type: "string", description: "Short code (e.g., DLX, STE)" },
          base_rate: { type: "number", description: "Base rate per night in BDT" },
          max_occupancy: { type: "number", description: "Maximum number of guests" },
          description: { type: "string", description: "Room type description" },
          amenities: { type: "array", items: { type: "string" }, description: "List of amenities" }
        },
        required: ["name", "code", "base_rate", "max_occupancy"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_room_type",
      description: "Update an existing room type",
      parameters: {
        type: "object",
        properties: {
          room_type_id: { type: "string", description: "Room type UUID" },
          name: { type: "string", description: "Room type name" },
          base_rate: { type: "number", description: "Base rate per night in BDT" },
          max_occupancy: { type: "number", description: "Maximum guests" },
          description: { type: "string", description: "Description" },
          amenities: { type: "array", items: { type: "string" }, description: "Amenities" },
          is_active: { type: "boolean", description: "Whether room type is active" }
        },
        required: ["room_type_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_room_type",
      description: "Delete a room type (only if no rooms exist)",
      parameters: {
        type: "object",
        properties: {
          room_type_id: { type: "string", description: "Room type UUID to delete" }
        },
        required: ["room_type_id"]
      }
    }
  },

  // ==================== ROOM MANAGEMENT ====================
  {
    type: "function",
    function: {
      name: "get_rooms",
      description: "Get list of rooms with their current status",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["vacant", "occupied", "dirty", "maintenance", "out_of_order"], description: "Filter by room status" },
          room_type_id: { type: "string", description: "Filter by room type ID" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_room",
      description: "Create a new room in the property",
      parameters: {
        type: "object",
        properties: {
          room_number: { type: "string", description: "Room number (e.g., 101, 202)" },
          room_type_id: { type: "string", description: "Room type UUID" },
          floor: { type: "string", description: "Floor number or name" },
          notes: { type: "string", description: "Additional notes about the room" }
        },
        required: ["room_number", "room_type_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_room",
      description: "Update room details",
      parameters: {
        type: "object",
        properties: {
          room_id: { type: "string", description: "Room UUID" },
          room_number: { type: "string", description: "Room number" },
          room_type_id: { type: "string", description: "Room type UUID" },
          floor: { type: "string", description: "Floor" },
          notes: { type: "string", description: "Notes" },
          is_active: { type: "boolean", description: "Whether room is active" }
        },
        required: ["room_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_room",
      description: "Delete a room (only if not in use)",
      parameters: {
        type: "object",
        properties: {
          room_id: { type: "string", description: "Room UUID to delete" }
        },
        required: ["room_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_room_status",
      description: "Update the status of a room",
      parameters: {
        type: "object",
        properties: {
          room_id: { type: "string", description: "Room UUID" },
          status: { type: "string", enum: ["vacant", "occupied", "dirty", "maintenance", "out_of_order"], description: "New room status" }
        },
        required: ["room_id", "status"]
      }
    }
  },

  // ==================== RESERVATION MANAGEMENT ====================
  {
    type: "function",
    function: {
      name: "search_reservations",
      description: "Search for reservations by confirmation number, guest name, or date range",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Confirmation number or guest name" },
          check_in_date: { type: "string", description: "Check-in date (YYYY-MM-DD)" },
          status: { type: "string", enum: ["confirmed", "checked_in", "checked_out", "cancelled", "no_show"], description: "Reservation status filter" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_reservation",
      description: "Create a new hotel reservation",
      parameters: {
        type: "object",
        properties: {
          guest_id: { type: "string", description: "Guest UUID" },
          check_in_date: { type: "string", description: "Check-in date (YYYY-MM-DD)" },
          check_out_date: { type: "string", description: "Check-out date (YYYY-MM-DD)" },
          room_type_id: { type: "string", description: "Room type UUID" },
          adults: { type: "number", description: "Number of adults" },
          children: { type: "number", description: "Number of children" },
          source: { type: "string", enum: ["direct", "phone", "walk_in", "website", "ota_booking", "ota_expedia", "ota_agoda", "corporate", "travel_agent", "other"], description: "Booking source" },
          special_requests: { type: "string", description: "Special requests from guest" },
          rate_per_night: { type: "number", description: "Rate per night (defaults to room type base rate)" }
        },
        required: ["guest_id", "check_in_date", "check_out_date", "room_type_id", "adults"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_reservation",
      description: "Update reservation details",
      parameters: {
        type: "object",
        properties: {
          reservation_id: { type: "string", description: "Reservation UUID" },
          check_in_date: { type: "string", description: "Check-in date (YYYY-MM-DD)" },
          check_out_date: { type: "string", description: "Check-out date (YYYY-MM-DD)" },
          adults: { type: "number", description: "Number of adults" },
          children: { type: "number", description: "Number of children" },
          special_requests: { type: "string", description: "Special requests" },
          internal_notes: { type: "string", description: "Internal notes" }
        },
        required: ["reservation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_reservation",
      description: "Cancel a reservation",
      parameters: {
        type: "object",
        properties: {
          reservation_id: { type: "string", description: "Reservation UUID to cancel" },
          reason: { type: "string", description: "Cancellation reason" }
        },
        required: ["reservation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_in_guest",
      description: "Check in a guest with a confirmed reservation",
      parameters: {
        type: "object",
        properties: {
          reservation_id: { type: "string", description: "Reservation UUID" },
          room_id: { type: "string", description: "Specific room to assign (optional)" }
        },
        required: ["reservation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_out_guest",
      description: "Check out a guest and process their departure",
      parameters: {
        type: "object",
        properties: {
          reservation_id: { type: "string", description: "Reservation UUID" }
        },
        required: ["reservation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_todays_arrivals",
      description: "Get list of guests arriving today",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_todays_departures",
      description: "Get list of guests departing today",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },

  // ==================== FOLIO MANAGEMENT ====================
  {
    type: "function",
    function: {
      name: "get_folios",
      description: "Get folios list for guests",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "closed"], description: "Filter by status" },
          guest_id: { type: "string", description: "Filter by guest ID" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_folio_details",
      description: "Get detailed folio information with all charges and payments",
      parameters: {
        type: "object",
        properties: {
          folio_id: { type: "string", description: "Folio UUID" }
        },
        required: ["folio_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_folio_charge",
      description: "Add a charge to a guest folio",
      parameters: {
        type: "object",
        properties: {
          folio_id: { type: "string", description: "Folio UUID" },
          item_type: { type: "string", enum: ["room_charge", "food_beverage", "laundry", "minibar", "spa", "parking", "telephone", "internet", "miscellaneous"], description: "Type of charge" },
          description: { type: "string", description: "Charge description" },
          amount: { type: "number", description: "Amount in BDT" },
          quantity: { type: "number", description: "Quantity (default 1)" }
        },
        required: ["folio_id", "item_type", "description", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "void_folio_charge",
      description: "Void a charge from a folio",
      parameters: {
        type: "object",
        properties: {
          folio_item_id: { type: "string", description: "Folio item UUID to void" },
          reason: { type: "string", description: "Reason for voiding" }
        },
        required: ["folio_item_id", "reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "record_payment",
      description: "Record a payment on a folio",
      parameters: {
        type: "object",
        properties: {
          folio_id: { type: "string", description: "Folio UUID" },
          amount: { type: "number", description: "Payment amount in BDT" },
          payment_method: { type: "string", enum: ["cash", "credit_card", "debit_card", "bank_transfer", "other"], description: "Payment method" },
          reference_number: { type: "string", description: "Reference/transaction number" },
          notes: { type: "string", description: "Payment notes" }
        },
        required: ["folio_id", "amount", "payment_method"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "void_payment",
      description: "Void a payment",
      parameters: {
        type: "object",
        properties: {
          payment_id: { type: "string", description: "Payment UUID to void" },
          reason: { type: "string", description: "Reason for voiding" }
        },
        required: ["payment_id", "reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "close_folio",
      description: "Close a folio (zero balance required)",
      parameters: {
        type: "object",
        properties: {
          folio_id: { type: "string", description: "Folio UUID to close" }
        },
        required: ["folio_id"]
      }
    }
  },

  // ==================== HOUSEKEEPING ====================
  {
    type: "function",
    function: {
      name: "create_housekeeping_task",
      description: "Create a housekeeping task for a room",
      parameters: {
        type: "object",
        properties: {
          room_id: { type: "string", description: "Room UUID" },
          task_type: { type: "string", enum: ["cleaning", "turndown", "deep_cleaning", "inspection"], description: "Type of housekeeping task" },
          priority: { type: "number", description: "Priority level (1-5, 1 being highest)" },
          notes: { type: "string", description: "Additional notes" },
          assigned_to: { type: "string", description: "Staff member UUID to assign to" }
        },
        required: ["room_id", "task_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_housekeeping_tasks",
      description: "Get housekeeping tasks list",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "in_progress", "completed"], description: "Filter by status" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_housekeeping_task",
      description: "Update a housekeeping task",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "Task UUID" },
          status: { type: "string", enum: ["pending", "in_progress", "completed"], description: "Task status" },
          priority: { type: "number", description: "Priority (1-5)" },
          notes: { type: "string", description: "Notes" }
        },
        required: ["task_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "complete_housekeeping_task",
      description: "Mark a housekeeping task as completed",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "Task UUID to complete" }
        },
        required: ["task_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "assign_housekeeping_task",
      description: "Assign a housekeeping task to a staff member",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "Task UUID" },
          staff_id: { type: "string", description: "Staff member UUID" }
        },
        required: ["task_id", "staff_id"]
      }
    }
  },

  // ==================== MAINTENANCE ====================
  {
    type: "function",
    function: {
      name: "create_maintenance_ticket",
      description: "Create a maintenance ticket for an issue",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Issue title" },
          description: { type: "string", description: "Detailed description of the issue" },
          room_id: { type: "string", description: "Room UUID (if room-specific)" },
          priority: { type: "number", description: "Priority level (1-5, 1 being highest)" },
          assigned_to: { type: "string", description: "Maintenance staff UUID" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_maintenance_tickets",
      description: "Get maintenance tickets list",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "in_progress", "resolved"], description: "Filter by status" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_maintenance_ticket",
      description: "Update a maintenance ticket",
      parameters: {
        type: "object",
        properties: {
          ticket_id: { type: "string", description: "Ticket UUID" },
          status: { type: "string", enum: ["open", "in_progress", "resolved"], description: "Status" },
          priority: { type: "number", description: "Priority (1-5)" },
          description: { type: "string", description: "Description" }
        },
        required: ["ticket_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "resolve_maintenance_ticket",
      description: "Mark a maintenance ticket as resolved",
      parameters: {
        type: "object",
        properties: {
          ticket_id: { type: "string", description: "Ticket UUID" },
          resolution_notes: { type: "string", description: "Notes about how the issue was resolved" }
        },
        required: ["ticket_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "assign_maintenance_ticket",
      description: "Assign a maintenance ticket to a staff member",
      parameters: {
        type: "object",
        properties: {
          ticket_id: { type: "string", description: "Ticket UUID" },
          staff_id: { type: "string", description: "Staff member UUID" }
        },
        required: ["ticket_id", "staff_id"]
      }
    }
  },

  // ==================== STAFF MANAGEMENT ====================
  {
    type: "function",
    function: {
      name: "get_staff_list",
      description: "Get list of all staff members with their roles",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["owner", "manager", "front_desk", "accountant", "housekeeping", "maintenance", "kitchen", "waiter", "night_auditor"], description: "Filter by role" },
          is_active: { type: "boolean", description: "Filter by active status" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_staff",
      description: "Create a new staff account with login credentials",
      parameters: {
        type: "object",
        properties: {
          username: { type: "string", description: "Login username" },
          password: { type: "string", description: "Initial password" },
          full_name: { type: "string", description: "Staff member's full name" },
          phone: { type: "string", description: "Phone number" },
          roles: { type: "array", items: { type: "string", enum: ["owner", "manager", "front_desk", "accountant", "housekeeping", "maintenance", "kitchen", "waiter", "night_auditor"] }, description: "Roles to assign" },
          must_change_password: { type: "boolean", description: "Require password change on first login" }
        },
        required: ["username", "password", "full_name", "roles"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_staff",
      description: "Delete a staff member account",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string", description: "Staff user UUID to delete" }
        },
        required: ["user_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "deactivate_staff",
      description: "Deactivate a staff member (disable login without deleting)",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string", description: "Staff user UUID to deactivate" }
        },
        required: ["user_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "activate_staff",
      description: "Reactivate a previously deactivated staff member",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string", description: "Staff user UUID to activate" }
        },
        required: ["user_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_staff_roles",
      description: "Update roles for a staff member",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string", description: "Staff user UUID" },
          roles: { type: "array", items: { type: "string" }, description: "New roles to assign (replaces existing)" }
        },
        required: ["user_id", "roles"]
      }
    }
  },

  // ==================== CORPORATE ACCOUNTS ====================
  {
    type: "function",
    function: {
      name: "create_corporate_account",
      description: "Create a new corporate account",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string", description: "Company name" },
          account_code: { type: "string", description: "Unique account code" },
          contact_name: { type: "string", description: "Primary contact name" },
          contact_email: { type: "string", description: "Contact email" },
          contact_phone: { type: "string", description: "Contact phone" },
          discount_percentage: { type: "number", description: "Discount percentage" },
          credit_limit: { type: "number", description: "Credit limit in BDT" },
          payment_terms: { type: "string", description: "Payment terms (e.g., net30)" }
        },
        required: ["company_name", "account_code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_corporate_accounts",
      description: "Get list of corporate accounts",
      parameters: {
        type: "object",
        properties: {
          is_active: { type: "boolean", description: "Filter by active status" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_corporate_account",
      description: "Update a corporate account",
      parameters: {
        type: "object",
        properties: {
          account_id: { type: "string", description: "Corporate account UUID" },
          company_name: { type: "string", description: "Company name" },
          contact_name: { type: "string", description: "Contact name" },
          contact_email: { type: "string", description: "Contact email" },
          contact_phone: { type: "string", description: "Contact phone" },
          discount_percentage: { type: "number", description: "Discount %" },
          credit_limit: { type: "number", description: "Credit limit" },
          payment_terms: { type: "string", description: "Payment terms" },
          is_active: { type: "boolean", description: "Active status" }
        },
        required: ["account_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_corporate_account",
      description: "Delete a corporate account",
      parameters: {
        type: "object",
        properties: {
          account_id: { type: "string", description: "Corporate account UUID to delete" }
        },
        required: ["account_id"]
      }
    }
  },

  // ==================== NIGHT AUDIT ====================
  {
    type: "function",
    function: {
      name: "get_night_audit_status",
      description: "Get the status of night audit for today",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "run_night_audit",
      description: "Start the night audit process",
      parameters: {
        type: "object",
        properties: {
          notes: { type: "string", description: "Notes for the audit" }
        },
        required: []
      }
    }
  },

  // ==================== POS MANAGEMENT ====================
  {
    type: "function",
    function: {
      name: "get_pos_outlets",
      description: "Get list of POS outlets (restaurants, bars, etc.)",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "create_pos_outlet",
      description: "Create a new POS outlet",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Outlet name" },
          code: { type: "string", description: "Short code (e.g., REST, BAR)" },
          type: { type: "string", enum: ["restaurant", "bar", "cafe", "room_service", "pool_bar"], description: "Outlet type" }
        },
        required: ["name", "code", "type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_pos_outlet",
      description: "Update a POS outlet",
      parameters: {
        type: "object",
        properties: {
          outlet_id: { type: "string", description: "Outlet UUID" },
          name: { type: "string", description: "Outlet name" },
          type: { type: "string", description: "Outlet type" },
          is_active: { type: "boolean", description: "Active status" }
        },
        required: ["outlet_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_pos_category",
      description: "Create a menu category for a POS outlet",
      parameters: {
        type: "object",
        properties: {
          outlet_id: { type: "string", description: "Outlet UUID" },
          name: { type: "string", description: "Category name" },
          sort_order: { type: "number", description: "Display order" }
        },
        required: ["outlet_id", "name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_pos_item",
      description: "Create a menu item",
      parameters: {
        type: "object",
        properties: {
          outlet_id: { type: "string", description: "Outlet UUID" },
          category_id: { type: "string", description: "Category UUID" },
          name: { type: "string", description: "Item name" },
          code: { type: "string", description: "Item code" },
          price: { type: "number", description: "Price in BDT" },
          description: { type: "string", description: "Item description" },
          prep_time_minutes: { type: "number", description: "Preparation time" }
        },
        required: ["outlet_id", "name", "code", "price"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_pos_item",
      description: "Update a menu item",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "Item UUID" },
          name: { type: "string", description: "Item name" },
          price: { type: "number", description: "Price" },
          description: { type: "string", description: "Description" },
          is_available: { type: "boolean", description: "Whether item is available" },
          is_active: { type: "boolean", description: "Whether item is active" }
        },
        required: ["item_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_pos_item",
      description: "Delete a menu item",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "Item UUID to delete" }
        },
        required: ["item_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_pos_order",
      description: "Create a new POS order",
      parameters: {
        type: "object",
        properties: {
          outlet_id: { type: "string", description: "Outlet UUID" },
          table_number: { type: "string", description: "Table number" },
          guest_id: { type: "string", description: "Guest UUID (optional for in-house guests)" },
          room_id: { type: "string", description: "Room UUID for room service" },
          items: { 
            type: "array", 
            items: {
              type: "object",
              properties: {
                item_name: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" }
              }
            },
            description: "Order items" 
          },
          notes: { type: "string", description: "Order notes" }
        },
        required: ["outlet_id", "items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_pos_orders",
      description: "Get POS orders list",
      parameters: {
        type: "object",
        properties: {
          outlet_id: { type: "string", description: "Filter by outlet" },
          status: { type: "string", enum: ["pending", "preparing", "ready", "served", "cancelled", "posted"], description: "Filter by status" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_pos_order_status",
      description: "Update order status",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "Order UUID" },
          status: { type: "string", enum: ["pending", "preparing", "ready", "served", "cancelled", "posted"], description: "New status" }
        },
        required: ["order_id", "status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_pos_order",
      description: "Cancel a POS order",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "Order UUID to cancel" }
        },
        required: ["order_id"]
      }
    }
  },

  // ==================== REPORTS ====================
  {
    type: "function",
    function: {
      name: "get_occupancy_report",
      description: "Get occupancy report for a date range",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          end_date: { type: "string", description: "End date (YYYY-MM-DD)" }
        },
        required: ["start_date", "end_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_revenue_report",
      description: "Get revenue report for a date range",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          end_date: { type: "string", description: "End date (YYYY-MM-DD)" }
        },
        required: ["start_date", "end_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_audit_logs",
      description: "Get recent audit logs / activity history",
      parameters: {
        type: "object",
        properties: {
          entity_type: { type: "string", description: "Filter by entity type (reservation, guest, room, etc.)" },
          limit: { type: "number", description: "Number of logs to return (default 20)" }
        },
        required: []
      }
    }
  },

  // ==================== SETTINGS ====================
  {
    type: "function",
    function: {
      name: "update_property_settings",
      description: "Update property settings (tax rate, service charge, etc.)",
      parameters: {
        type: "object",
        properties: {
          tax_rate: { type: "number", description: "Tax rate percentage" },
          service_charge_rate: { type: "number", description: "Service charge percentage" },
          currency: { type: "string", description: "Currency code" },
          timezone: { type: "string", description: "Timezone" }
        },
        required: []
      }
    }
  },

  // ==================== BULK OPERATIONS ====================
  {
    type: "function",
    function: {
      name: "bulk_create_rooms",
      description: "Create multiple rooms at once. Use this for bulk room creation instead of calling create_room multiple times.",
      parameters: {
        type: "object",
        properties: {
          rooms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                room_number: { type: "string", description: "Room number (e.g., 101, 102)" },
                room_type_id: { type: "string", description: "Room type UUID" },
                floor: { type: "string", description: "Floor number" }
              },
              required: ["room_number", "room_type_id"]
            },
            description: "Array of rooms to create"
          }
        },
        required: ["rooms"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "bulk_create_guests",
      description: "Create multiple guest profiles at once. Use this for bulk guest creation instead of calling create_guest multiple times.",
      parameters: {
        type: "object",
        properties: {
          guests: {
            type: "array",
            items: {
              type: "object",
              properties: {
                first_name: { type: "string", description: "Guest's first name" },
                last_name: { type: "string", description: "Guest's last name" },
                email: { type: "string", description: "Guest's email" },
                phone: { type: "string", description: "Guest's phone number" },
                nationality: { type: "string", description: "Guest's nationality" },
                is_vip: { type: "boolean", description: "Whether guest is VIP" }
              },
              required: ["first_name", "last_name"]
            },
            description: "Array of guests to create"
          }
        },
        required: ["guests"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "bulk_create_reservations_with_checkin",
      description: "Create multiple reservations and optionally check them in immediately. Perfect for setting up mock data with in-house guests.",
      parameters: {
        type: "object",
        properties: {
          reservations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                guest_id: { type: "string", description: "Guest UUID" },
                room_id: { type: "string", description: "Room UUID to assign" },
                room_type_id: { type: "string", description: "Room type UUID" },
                check_in_date: { type: "string", description: "Check-in date (YYYY-MM-DD)" },
                check_out_date: { type: "string", description: "Check-out date (YYYY-MM-DD)" },
                adults: { type: "number", description: "Number of adults" },
                should_check_in: { type: "boolean", description: "Whether to check in immediately" }
              },
              required: ["guest_id", "room_type_id", "check_in_date", "check_out_date", "adults"]
            },
            description: "Array of reservations to create"
          }
        },
        required: ["reservations"]
      }
    }
  }
];

// Tool execution handlers
async function executeTool(toolName: string, args: any, supabase: any, tenantId: string, propertyId: string, userId: string): Promise<{ success: boolean; data?: any; error?: string; renamed?: string | null; errors?: string[]; reservations?: any[]; checked_in?: string[] }> {
  try {
    switch (toolName) {
      // ==================== DASHBOARD ====================
      case "get_dashboard_stats": {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: rooms } = await supabase.from('rooms').select('status').eq('tenant_id', tenantId);
        const totalRooms = rooms?.length || 0;
        const occupiedRooms = rooms?.filter((r: any) => r.status === 'occupied').length || 0;
        const vacantRooms = rooms?.filter((r: any) => r.status === 'vacant').length || 0;
        
        const { data: arrivals } = await supabase.from('reservations').select('id').eq('tenant_id', tenantId).eq('check_in_date', today).eq('status', 'confirmed');
        const { data: departures } = await supabase.from('reservations').select('id').eq('tenant_id', tenantId).eq('check_out_date', today).eq('status', 'checked_in');
        const { data: inHouse } = await supabase.from('reservations').select('id').eq('tenant_id', tenantId).eq('status', 'checked_in');
        
        return {
          success: true,
          data: {
            total_rooms: totalRooms,
            occupied_rooms: occupiedRooms,
            vacant_rooms: vacantRooms,
            occupancy_rate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            todays_arrivals: arrivals?.length || 0,
            todays_departures: departures?.length || 0,
            in_house_guests: inHouse?.length || 0
          }
        };
      }

      // ==================== GUEST MANAGEMENT ====================
      case "search_guests": {
        const { query } = args;
        const { data, error } = await supabase.from('guests')
          .select('*')
          .eq('tenant_id', tenantId)
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(10);
        
        if (error) throw error;
        return { success: true, data };
      }

      case "create_guest": {
        const { data, error } = await supabase.from('guests')
          .insert({
            tenant_id: tenantId,
            first_name: args.first_name,
            last_name: args.last_name,
            email: args.email || null,
            phone: args.phone || null,
            nationality: args.nationality || null,
            id_type: args.id_type || null,
            id_number: args.id_number || null,
            is_vip: args.is_vip || false,
            address: args.address || null,
            city: args.city || null,
            country: args.country || null
          })
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "update_guest": {
        const updateData: any = {};
        if (args.first_name) updateData.first_name = args.first_name;
        if (args.last_name) updateData.last_name = args.last_name;
        if (args.email !== undefined) updateData.email = args.email;
        if (args.phone !== undefined) updateData.phone = args.phone;
        if (args.nationality !== undefined) updateData.nationality = args.nationality;
        if (args.id_type !== undefined) updateData.id_type = args.id_type;
        if (args.id_number !== undefined) updateData.id_number = args.id_number;
        if (args.address !== undefined) updateData.address = args.address;
        if (args.city !== undefined) updateData.city = args.city;
        if (args.country !== undefined) updateData.country = args.country;
        if (args.notes !== undefined) updateData.notes = args.notes;

        const { data, error } = await supabase.from('guests')
          .update(updateData)
          .eq('id', args.guest_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "delete_guest": {
        // Check if guest has reservations
        const { data: reservations } = await supabase.from('reservations')
          .select('id')
          .eq('guest_id', args.guest_id)
          .limit(1);
        
        if (reservations && reservations.length > 0) {
          throw new Error('Cannot delete guest with existing reservations');
        }

        const { error } = await supabase.from('guests')
          .delete()
          .eq('id', args.guest_id)
          .eq('tenant_id', tenantId);
        
        if (error) throw error;
        return { success: true, data: { deleted: true } };
      }

      case "toggle_guest_vip": {
        const { data, error } = await supabase.from('guests')
          .update({ is_vip: args.is_vip })
          .eq('id', args.guest_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "toggle_guest_blacklist": {
        const { data, error } = await supabase.from('guests')
          .update({ 
            is_blacklisted: args.is_blacklisted,
            blacklist_reason: args.is_blacklisted ? (args.reason || null) : null
          })
          .eq('id', args.guest_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      // ==================== ROOM TYPE MANAGEMENT ====================
      case "get_room_types": {
        const { data, error } = await supabase.from('room_types')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('base_rate');
        
        if (error) throw error;
        return { success: true, data };
      }

      case "create_room_type": {
        // Check if code already exists
        const { data: existingType } = await supabase.from('room_types')
          .select('code')
          .eq('property_id', propertyId)
          .eq('code', args.code.toUpperCase())
          .eq('is_active', true)
          .maybeSingle();
        
        let finalCode = args.code.toUpperCase();
        let wasRenamed = false;
        
        if (existingType) {
          // Generate unique code by adding number suffix
          for (let i = 2; i <= 9; i++) {
            const candidate = `${args.code.toUpperCase()}${i}`;
            const { data: check } = await supabase.from('room_types')
              .select('code')
              .eq('property_id', propertyId)
              .eq('code', candidate)
              .eq('is_active', true)
              .maybeSingle();
            
            if (!check) {
              finalCode = candidate;
              wasRenamed = true;
              break;
            }
          }
        }
        
        const { data, error } = await supabase.from('room_types')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            name: args.name,
            code: finalCode,
            base_rate: args.base_rate,
            max_occupancy: args.max_occupancy,
            description: args.description || null,
            amenities: args.amenities || []
          })
          .select()
          .single();
        
        if (error) throw error;
        return { 
          success: true, 
          data,
          renamed: wasRenamed ? `Code ${args.code.toUpperCase()} already existed, created as ${finalCode}` : null
        };
      }

      case "update_room_type": {
        const updateData: any = {};
        if (args.name) updateData.name = args.name;
        if (args.base_rate !== undefined) updateData.base_rate = args.base_rate;
        if (args.max_occupancy !== undefined) updateData.max_occupancy = args.max_occupancy;
        if (args.description !== undefined) updateData.description = args.description;
        if (args.amenities !== undefined) updateData.amenities = args.amenities;
        if (args.is_active !== undefined) updateData.is_active = args.is_active;

        const { data, error } = await supabase.from('room_types')
          .update(updateData)
          .eq('id', args.room_type_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "delete_room_type": {
        const { data: rooms } = await supabase.from('rooms')
          .select('id')
          .eq('room_type_id', args.room_type_id)
          .limit(1);
        
        if (rooms && rooms.length > 0) {
          throw new Error('Cannot delete room type with existing rooms');
        }

        const { error } = await supabase.from('room_types')
          .delete()
          .eq('id', args.room_type_id)
          .eq('tenant_id', tenantId);
        
        if (error) throw error;
        return { success: true, data: { deleted: true } };
      }

      // ==================== ROOM MANAGEMENT ====================
      case "get_rooms": {
        let query = supabase.from('rooms')
          .select('*, room_types(name, code)')
          .eq('tenant_id', tenantId);
        
        if (args.status) query = query.eq('status', args.status);
        if (args.room_type_id) query = query.eq('room_type_id', args.room_type_id);
        
        const { data, error } = await query.order('room_number');
        if (error) throw error;
        return { success: true, data };
      }

      case "create_room": {
        // Check if room number already exists
        const { data: existingRoom } = await supabase.from('rooms')
          .select('room_number')
          .eq('property_id', propertyId)
          .eq('room_number', args.room_number)
          .eq('is_active', true)
          .maybeSingle();
        
        let finalRoomNumber = args.room_number;
        let wasRenamed = false;
        
        if (existingRoom) {
          // Generate a unique room number by appending a suffix
          // Try: 101A, 101B, 101C, etc.
          const suffixes = ['A', 'B', 'C', 'D', 'E', 'F'];
          let found = false;
          
          for (const suffix of suffixes) {
            const candidate = `${args.room_number}${suffix}`;
            const { data: check } = await supabase.from('rooms')
              .select('room_number')
              .eq('property_id', propertyId)
              .eq('room_number', candidate)
              .eq('is_active', true)
              .maybeSingle();
            
            if (!check) {
              finalRoomNumber = candidate;
              found = true;
              wasRenamed = true;
              break;
            }
          }
          
          if (!found) {
            // Fallback: add timestamp suffix
            finalRoomNumber = `${args.room_number}-${Date.now().toString().slice(-4)}`;
            wasRenamed = true;
          }
        }
        
        const { data, error } = await supabase.from('rooms')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            room_number: finalRoomNumber,
            room_type_id: args.room_type_id,
            floor: args.floor || null,
            notes: args.notes || null,
            status: 'vacant'
          })
          .select('*, room_types(name)')
          .single();
        
        if (error) throw error;
        return { 
          success: true, 
          data,
          renamed: wasRenamed ? `Room ${args.room_number} already existed, created as ${finalRoomNumber}` : null
        };
      }

      case "update_room": {
        const updateData: any = {};
        if (args.room_number) updateData.room_number = args.room_number;
        if (args.room_type_id) updateData.room_type_id = args.room_type_id;
        if (args.floor !== undefined) updateData.floor = args.floor;
        if (args.notes !== undefined) updateData.notes = args.notes;
        if (args.is_active !== undefined) updateData.is_active = args.is_active;

        const { data, error } = await supabase.from('rooms')
          .update(updateData)
          .eq('id', args.room_id)
          .eq('tenant_id', tenantId)
          .select('*, room_types(name)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "delete_room": {
        const { data: room } = await supabase.from('rooms')
          .select('status')
          .eq('id', args.room_id)
          .single();
        
        if (room?.status === 'occupied') {
          throw new Error('Cannot delete an occupied room');
        }

        const { error } = await supabase.from('rooms')
          .delete()
          .eq('id', args.room_id)
          .eq('tenant_id', tenantId);
        
        if (error) throw error;
        return { success: true, data: { deleted: true } };
      }

      case "update_room_status": {
        const { data, error } = await supabase.from('rooms')
          .update({ status: args.status })
          .eq('id', args.room_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      // ==================== RESERVATION MANAGEMENT ====================
      case "search_reservations": {
        let query = supabase.from('reservations')
          .select('*, guests(first_name, last_name, email, phone)')
          .eq('tenant_id', tenantId);
        
        if (args.query) {
          query = query.or(`confirmation_number.ilike.%${args.query}%`);
        }
        if (args.check_in_date) {
          query = query.eq('check_in_date', args.check_in_date);
        }
        if (args.status) {
          query = query.eq('status', args.status);
        }
        
        const { data, error } = await query.order('check_in_date', { ascending: false }).limit(20);
        if (error) throw error;
        return { success: true, data };
      }

      case "create_reservation": {
        const { data: roomType } = await supabase.from('room_types')
          .select('base_rate, code')
          .eq('id', args.room_type_id)
          .single();
        
        const { data: property } = await supabase.from('properties')
          .select('code')
          .eq('id', propertyId)
          .single();
        
        const rate = args.rate_per_night || roomType?.base_rate || 0;
        const checkIn = new Date(args.check_in_date);
        const checkOut = new Date(args.check_out_date);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const totalAmount = rate * nights;
        
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const confirmationNumber = `${property?.code || 'RES'}-${dateStr}-${randomNum}`;
        
        const { data: reservation, error: resError } = await supabase.from('reservations')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            guest_id: args.guest_id,
            check_in_date: args.check_in_date,
            check_out_date: args.check_out_date,
            adults: args.adults,
            children: args.children || 0,
            source: args.source || 'direct',
            special_requests: args.special_requests || null,
            total_amount: totalAmount,
            confirmation_number: confirmationNumber,
            created_by: userId
          })
          .select('*, guests(first_name, last_name)')
          .single();
        
        if (resError) throw resError;
        
        await supabase.from('reservation_rooms')
          .insert({
            tenant_id: tenantId,
            reservation_id: reservation.id,
            room_type_id: args.room_type_id,
            rate_per_night: rate,
            adults: args.adults,
            children: args.children || 0
          });
        
        return { success: true, data: { ...reservation, nights, rate_per_night: rate } };
      }

      case "update_reservation": {
        const updateData: any = {};
        if (args.check_in_date) updateData.check_in_date = args.check_in_date;
        if (args.check_out_date) updateData.check_out_date = args.check_out_date;
        if (args.adults !== undefined) updateData.adults = args.adults;
        if (args.children !== undefined) updateData.children = args.children;
        if (args.special_requests !== undefined) updateData.special_requests = args.special_requests;
        if (args.internal_notes !== undefined) updateData.internal_notes = args.internal_notes;

        const { data, error } = await supabase.from('reservations')
          .update(updateData)
          .eq('id', args.reservation_id)
          .eq('tenant_id', tenantId)
          .select('*, guests(first_name, last_name)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "cancel_reservation": {
        const { data, error } = await supabase.from('reservations')
          .update({ 
            status: 'cancelled',
            internal_notes: args.reason ? `Cancelled: ${args.reason}` : 'Cancelled'
          })
          .eq('id', args.reservation_id)
          .eq('tenant_id', tenantId)
          .select('*, guests(first_name, last_name)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "check_in_guest": {
        const { data: reservation, error: fetchError } = await supabase.from('reservations')
          .select('*, guests(first_name, last_name)')
          .eq('id', args.reservation_id)
          .single();
        
        if (fetchError) throw fetchError;
        if (reservation.status !== 'confirmed') {
          throw new Error(`Cannot check in: Reservation status is ${reservation.status}`);
        }
        
        const { error: updateError } = await supabase.from('reservations')
          .update({ 
            status: 'checked_in',
            actual_check_in: new Date().toISOString()
          })
          .eq('id', args.reservation_id);
        
        if (updateError) throw updateError;
        
        if (args.room_id) {
          await supabase.from('rooms').update({ status: 'occupied' }).eq('id', args.room_id);
          await supabase.from('reservation_rooms').update({ room_id: args.room_id }).eq('reservation_id', args.reservation_id);
        }
        
        const folioNumber = `F-${reservation.confirmation_number}`;
        await supabase.from('folios')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            guest_id: reservation.guest_id,
            reservation_id: reservation.id,
            folio_number: folioNumber
          });
        
        return { 
          success: true, 
          data: { ...reservation, status: 'checked_in', folio_number: folioNumber } 
        };
      }

      case "check_out_guest": {
        const { data: reservation, error: fetchError } = await supabase.from('reservations')
          .select('*, guests(first_name, last_name), reservation_rooms(room_id)')
          .eq('id', args.reservation_id)
          .single();
        
        if (fetchError) throw fetchError;
        if (reservation.status !== 'checked_in') {
          throw new Error(`Cannot check out: Reservation status is ${reservation.status}`);
        }
        
        const { error: updateError } = await supabase.from('reservations')
          .update({ 
            status: 'checked_out',
            actual_check_out: new Date().toISOString()
          })
          .eq('id', args.reservation_id);
        
        if (updateError) throw updateError;
        
        if (reservation.reservation_rooms?.[0]?.room_id) {
          await supabase.from('rooms').update({ status: 'dirty' }).eq('id', reservation.reservation_rooms[0].room_id);
        }
        
        await supabase.from('folios')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .eq('reservation_id', args.reservation_id);
        
        return { success: true, data: { ...reservation, status: 'checked_out' } };
      }

      case "get_todays_arrivals": {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('reservations')
          .select('*, guests(first_name, last_name, email, phone, is_vip)')
          .eq('tenant_id', tenantId)
          .eq('check_in_date', today)
          .eq('status', 'confirmed')
          .order('created_at');
        
        if (error) throw error;
        return { success: true, data };
      }

      case "get_todays_departures": {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('reservations')
          .select('*, guests(first_name, last_name, email, phone)')
          .eq('tenant_id', tenantId)
          .eq('check_out_date', today)
          .eq('status', 'checked_in')
          .order('created_at');
        
        if (error) throw error;
        return { success: true, data };
      }

      // ==================== FOLIO MANAGEMENT ====================
      case "get_folios": {
        let query = supabase.from('folios')
          .select('*, guests(first_name, last_name)')
          .eq('tenant_id', tenantId);
        
        if (args.status) query = query.eq('status', args.status);
        if (args.guest_id) query = query.eq('guest_id', args.guest_id);
        
        const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        return { success: true, data };
      }

      case "get_folio_details": {
        const { data, error } = await supabase.from('folios')
          .select('*, guests(first_name, last_name), folio_items(*), payments(*)')
          .eq('id', args.folio_id)
          .eq('tenant_id', tenantId)
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "add_folio_charge": {
        const { data, error } = await supabase.from('folio_items')
          .insert({
            tenant_id: tenantId,
            folio_id: args.folio_id,
            item_type: args.item_type,
            description: args.description,
            unit_price: args.amount,
            quantity: args.quantity || 1,
            total_price: args.amount * (args.quantity || 1),
            posted_by: userId
          })
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "void_folio_charge": {
        const { data, error } = await supabase.from('folio_items')
          .update({
            voided: true,
            voided_at: new Date().toISOString(),
            voided_by: userId,
            void_reason: args.reason
          })
          .eq('id', args.folio_item_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "record_payment": {
        const { data, error } = await supabase.from('payments')
          .insert({
            tenant_id: tenantId,
            folio_id: args.folio_id,
            amount: args.amount,
            payment_method: args.payment_method,
            reference_number: args.reference_number || null,
            notes: args.notes || null,
            received_by: userId
          })
          .select()
          .single();
        
        if (error) throw error;
        
        const { data: folio } = await supabase.from('folios')
          .select('paid_amount')
          .eq('id', args.folio_id)
          .single();
        
        await supabase.from('folios')
          .update({ paid_amount: (folio?.paid_amount || 0) + args.amount })
          .eq('id', args.folio_id);
        
        return { success: true, data };
      }

      case "void_payment": {
        const { data, error } = await supabase.from('payments')
          .update({
            voided: true,
            voided_at: new Date().toISOString(),
            voided_by: userId,
            void_reason: args.reason
          })
          .eq('id', args.payment_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "close_folio": {
        const { data: folio } = await supabase.from('folios')
          .select('balance')
          .eq('id', args.folio_id)
          .single();
        
        if (folio?.balance !== 0) {
          throw new Error(`Cannot close folio with balance: ৳${folio?.balance}`);
        }

        const { data, error } = await supabase.from('folios')
          .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
            closed_by: userId
          })
          .eq('id', args.folio_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      // ==================== HOUSEKEEPING ====================
      case "create_housekeeping_task": {
        const { data, error } = await supabase.from('housekeeping_tasks')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            room_id: args.room_id,
            task_type: args.task_type,
            priority: args.priority || 3,
            notes: args.notes || null,
            assigned_to: args.assigned_to || null,
            status: 'pending'
          })
          .select('*, rooms(room_number)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "get_housekeeping_tasks": {
        let query = supabase.from('housekeeping_tasks')
          .select('*, rooms(room_number)')
          .eq('tenant_id', tenantId);
        
        if (args.status) query = query.eq('status', args.status);
        
        const { data, error } = await query.order('priority').order('created_at');
        if (error) throw error;
        return { success: true, data };
      }

      case "update_housekeeping_task": {
        const updateData: any = {};
        if (args.status) updateData.status = args.status;
        if (args.priority !== undefined) updateData.priority = args.priority;
        if (args.notes !== undefined) updateData.notes = args.notes;
        if (args.status === 'in_progress' && !updateData.started_at) {
          updateData.started_at = new Date().toISOString();
        }

        const { data, error } = await supabase.from('housekeeping_tasks')
          .update(updateData)
          .eq('id', args.task_id)
          .eq('tenant_id', tenantId)
          .select('*, rooms(room_number)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "complete_housekeeping_task": {
        const { data, error } = await supabase.from('housekeeping_tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', args.task_id)
          .eq('tenant_id', tenantId)
          .select('*, rooms(room_number)')
          .single();
        
        if (error) throw error;

        // Update room status to vacant if it was dirty
        if (data.rooms?.room_number) {
          await supabase.from('rooms')
            .update({ status: 'vacant' })
            .eq('id', data.room_id)
            .eq('status', 'dirty');
        }
        
        return { success: true, data };
      }

      case "assign_housekeeping_task": {
        const { data, error } = await supabase.from('housekeeping_tasks')
          .update({ assigned_to: args.staff_id })
          .eq('id', args.task_id)
          .eq('tenant_id', tenantId)
          .select('*, rooms(room_number)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      // ==================== MAINTENANCE ====================
      case "create_maintenance_ticket": {
        const { data, error } = await supabase.from('maintenance_tickets')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            title: args.title,
            description: args.description || null,
            room_id: args.room_id || null,
            priority: args.priority || 3,
            assigned_to: args.assigned_to || null,
            reported_by: userId,
            status: 'open'
          })
          .select('*, rooms(room_number)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "get_maintenance_tickets": {
        let query = supabase.from('maintenance_tickets')
          .select('*, rooms(room_number)')
          .eq('tenant_id', tenantId);
        
        if (args.status) query = query.eq('status', args.status);
        
        const { data, error } = await query.order('priority').order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, data };
      }

      case "update_maintenance_ticket": {
        const updateData: any = {};
        if (args.status) updateData.status = args.status;
        if (args.priority !== undefined) updateData.priority = args.priority;
        if (args.description !== undefined) updateData.description = args.description;

        const { data, error } = await supabase.from('maintenance_tickets')
          .update(updateData)
          .eq('id', args.ticket_id)
          .eq('tenant_id', tenantId)
          .select('*, rooms(room_number)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "resolve_maintenance_ticket": {
        const { data, error } = await supabase.from('maintenance_tickets')
          .update({
            status: 'resolved',
            resolution_notes: args.resolution_notes || null,
            resolved_at: new Date().toISOString(),
            resolved_by: userId
          })
          .eq('id', args.ticket_id)
          .eq('tenant_id', tenantId)
          .select('*, rooms(room_number)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "assign_maintenance_ticket": {
        const { data, error } = await supabase.from('maintenance_tickets')
          .update({ assigned_to: args.staff_id })
          .eq('id', args.ticket_id)
          .eq('tenant_id', tenantId)
          .select('*, rooms(room_number)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      // ==================== STAFF MANAGEMENT ====================
      case "get_staff_list": {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, is_active')
          .eq('tenant_id', tenantId)
          .order('full_name');
        
        if (profilesError) throw profilesError;
        
        const userIds = profiles?.map((p: any) => p.id) || [];
        let roles: any[] = [];
        if (userIds.length > 0) {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', userIds);
          roles = rolesData || [];
        }
        
        let staffList = (profiles || []).map((profile: any) => ({
          ...profile,
          user_roles: roles.filter((r: any) => r.user_id === profile.id)
        }));
        
        if (args.role) {
          staffList = staffList.filter((s: any) => 
            s.user_roles?.some((r: any) => r.role === args.role)
          );
        }
        if (args.is_active !== undefined) {
          staffList = staffList.filter((s: any) => s.is_active === args.is_active);
        }
        
        return { success: true, data: staffList };
      }

      case "create_staff": {
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('tenant_id', tenantId);
        
        const propertyIds = properties?.map((p: any) => p.id) || [];
        
        if (propertyIds.length === 0) {
          throw new Error('No properties found for this tenant');
        }
        
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-staff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            username: args.username,
            password: args.password,
            fullName: args.full_name,
            phone: args.phone || null,
            roles: args.roles,
            propertyIds: propertyIds,
            mustChangePassword: args.must_change_password !== false
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create staff');
        }
        
        return { success: true, data: result.user };
      }

      case "delete_staff": {
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/delete-staff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ userId: args.user_id })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete staff');
        }
        
        return { success: true, data: { deleted: true } };
      }

      case "deactivate_staff": {
        const { data, error } = await supabase.from('profiles')
          .update({ is_active: false })
          .eq('id', args.user_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "activate_staff": {
        const { data, error } = await supabase.from('profiles')
          .update({ is_active: true })
          .eq('id', args.user_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "update_staff_roles": {
        // Delete existing roles
        await supabase.from('user_roles')
          .delete()
          .eq('user_id', args.user_id);
        
        // Insert new roles
        const roleInserts = args.roles.map((role: string) => ({
          user_id: args.user_id,
          role: role
        }));
        
        const { error } = await supabase.from('user_roles').insert(roleInserts);
        if (error) throw error;
        
        return { success: true, data: { roles: args.roles } };
      }

      // ==================== CORPORATE ACCOUNTS ====================
      case "create_corporate_account": {
        const { data, error } = await supabase.from('corporate_accounts')
          .insert({
            tenant_id: tenantId,
            company_name: args.company_name,
            account_code: args.account_code.toUpperCase(),
            contact_name: args.contact_name || null,
            contact_email: args.contact_email || null,
            contact_phone: args.contact_phone || null,
            discount_percentage: args.discount_percentage || 0,
            credit_limit: args.credit_limit || 0,
            payment_terms: args.payment_terms || 'net30'
          })
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "get_corporate_accounts": {
        let query = supabase.from('corporate_accounts')
          .select('*')
          .eq('tenant_id', tenantId);
        
        if (args.is_active !== undefined) {
          query = query.eq('is_active', args.is_active);
        }
        
        const { data, error } = await query.order('company_name');
        if (error) throw error;
        return { success: true, data };
      }

      case "update_corporate_account": {
        const updateData: any = {};
        if (args.company_name) updateData.company_name = args.company_name;
        if (args.contact_name !== undefined) updateData.contact_name = args.contact_name;
        if (args.contact_email !== undefined) updateData.contact_email = args.contact_email;
        if (args.contact_phone !== undefined) updateData.contact_phone = args.contact_phone;
        if (args.discount_percentage !== undefined) updateData.discount_percentage = args.discount_percentage;
        if (args.credit_limit !== undefined) updateData.credit_limit = args.credit_limit;
        if (args.payment_terms !== undefined) updateData.payment_terms = args.payment_terms;
        if (args.is_active !== undefined) updateData.is_active = args.is_active;

        const { data, error } = await supabase.from('corporate_accounts')
          .update(updateData)
          .eq('id', args.account_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "delete_corporate_account": {
        const { error } = await supabase.from('corporate_accounts')
          .delete()
          .eq('id', args.account_id)
          .eq('tenant_id', tenantId);
        
        if (error) throw error;
        return { success: true, data: { deleted: true } };
      }

      // ==================== NIGHT AUDIT ====================
      case "get_night_audit_status": {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('night_audits')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('business_date', today)
          .maybeSingle();
        
        if (error) throw error;
        return { 
          success: true, 
          data: data || { status: 'not_started', business_date: today }
        };
      }

      case "run_night_audit": {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: existing } = await supabase.from('night_audits')
          .select('id, status')
          .eq('tenant_id', tenantId)
          .eq('business_date', today)
          .maybeSingle();
        
        if (existing?.status === 'completed') {
          throw new Error('Night audit already completed for today');
        }
        
        const { data: rooms } = await supabase.from('rooms')
          .select('status')
          .eq('tenant_id', tenantId);
        
        const totalRooms = rooms?.length || 0;
        const occupiedRooms = rooms?.filter((r: any) => r.status === 'occupied').length || 0;
        
        const auditData = {
          tenant_id: tenantId,
          property_id: propertyId,
          business_date: today,
          status: 'completed',
          run_by: userId,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          occupancy_rate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
          rooms_charged: occupiedRooms,
          notes: args.notes || null
        };
        
        let result;
        if (existing) {
          const { data, error } = await supabase.from('night_audits')
            .update(auditData)
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await supabase.from('night_audits')
            .insert(auditData)
            .select()
            .single();
          if (error) throw error;
          result = data;
        }
        
        return { success: true, data: result };
      }

      // ==================== POS MANAGEMENT ====================
      case "get_pos_outlets": {
        const { data, error } = await supabase.from('pos_outlets')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        return { success: true, data };
      }

      case "create_pos_outlet": {
        const { data, error } = await supabase.from('pos_outlets')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            name: args.name,
            code: args.code.toUpperCase(),
            type: args.type
          })
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "update_pos_outlet": {
        const updateData: any = {};
        if (args.name) updateData.name = args.name;
        if (args.type) updateData.type = args.type;
        if (args.is_active !== undefined) updateData.is_active = args.is_active;

        const { data, error } = await supabase.from('pos_outlets')
          .update(updateData)
          .eq('id', args.outlet_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "create_pos_category": {
        const { data, error } = await supabase.from('pos_categories')
          .insert({
            tenant_id: tenantId,
            outlet_id: args.outlet_id,
            name: args.name,
            sort_order: args.sort_order || 0
          })
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "create_pos_item": {
        const { data, error } = await supabase.from('pos_items')
          .insert({
            tenant_id: tenantId,
            outlet_id: args.outlet_id,
            category_id: args.category_id || null,
            name: args.name,
            code: args.code.toUpperCase(),
            price: args.price,
            description: args.description || null,
            prep_time_minutes: args.prep_time_minutes || 15
          })
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "update_pos_item": {
        const updateData: any = {};
        if (args.name) updateData.name = args.name;
        if (args.price !== undefined) updateData.price = args.price;
        if (args.description !== undefined) updateData.description = args.description;
        if (args.is_available !== undefined) updateData.is_available = args.is_available;
        if (args.is_active !== undefined) updateData.is_active = args.is_active;

        const { data, error } = await supabase.from('pos_items')
          .update(updateData)
          .eq('id', args.item_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "delete_pos_item": {
        const { error } = await supabase.from('pos_items')
          .delete()
          .eq('id', args.item_id)
          .eq('tenant_id', tenantId);
        
        if (error) throw error;
        return { success: true, data: { deleted: true } };
      }

      case "create_pos_order": {
        const { data: outlet } = await supabase.from('pos_outlets')
          .select('code')
          .eq('id', args.outlet_id)
          .single();
        
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `${outlet?.code || 'ORD'}-${dateStr}-${randomNum}`;
        
        const subtotal = args.items.reduce((sum: number, item: any) => 
          sum + (item.unit_price * item.quantity), 0);
        
        const { data: order, error: orderError } = await supabase.from('pos_orders')
          .insert({
            tenant_id: tenantId,
            outlet_id: args.outlet_id,
            order_number: orderNumber,
            table_number: args.table_number || null,
            guest_id: args.guest_id || null,
            room_id: args.room_id || null,
            subtotal,
            total_amount: subtotal,
            notes: args.notes || null,
            created_by: userId,
            status: 'pending'
          })
          .select()
          .single();
        
        if (orderError) throw orderError;
        
        const orderItems = args.items.map((item: any) => ({
          tenant_id: tenantId,
          order_id: order.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          status: 'pending'
        }));
        
        await supabase.from('pos_order_items').insert(orderItems);
        
        return { success: true, data: { ...order, items: args.items } };
      }

      case "get_pos_orders": {
        let query = supabase.from('pos_orders')
          .select('*, pos_outlets(name), pos_order_items(*)')
          .eq('tenant_id', tenantId);
        
        if (args.outlet_id) query = query.eq('outlet_id', args.outlet_id);
        if (args.status) query = query.eq('status', args.status);
        
        const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        return { success: true, data };
      }

      case "update_pos_order_status": {
        const { data, error } = await supabase.from('pos_orders')
          .update({ status: args.status })
          .eq('id', args.order_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "cancel_pos_order": {
        const { data, error } = await supabase.from('pos_orders')
          .update({ status: 'cancelled' })
          .eq('id', args.order_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      // ==================== REPORTS ====================
      case "get_occupancy_report": {
        const { data: reservations, error } = await supabase.from('reservations')
          .select('check_in_date, check_out_date, status')
          .eq('tenant_id', tenantId)
          .gte('check_in_date', args.start_date)
          .lte('check_out_date', args.end_date)
          .in('status', ['confirmed', 'checked_in', 'checked_out']);
        
        if (error) throw error;
        
        const { data: rooms } = await supabase.from('rooms')
          .select('id')
          .eq('tenant_id', tenantId);
        
        const totalRooms = rooms?.length || 0;
        
        return { 
          success: true, 
          data: {
            start_date: args.start_date,
            end_date: args.end_date,
            total_rooms: totalRooms,
            total_reservations: reservations?.length || 0
          }
        };
      }

      case "get_revenue_report": {
        // Get folio items for the period
        const { data: folioItems } = await supabase.from('folio_items')
          .select('item_type, total_price, service_date')
          .eq('tenant_id', tenantId)
          .eq('voided', false)
          .gte('service_date', args.start_date)
          .lte('service_date', args.end_date);
        
        let roomRevenue = 0;
        let fbRevenue = 0;
        let otherRevenue = 0;
        
        (folioItems || []).forEach((item: any) => {
          if (item.item_type === 'room_charge') {
            roomRevenue += parseFloat(item.total_price) || 0;
          } else if (item.item_type === 'food_beverage') {
            fbRevenue += parseFloat(item.total_price) || 0;
          } else {
            otherRevenue += parseFloat(item.total_price) || 0;
          }
        });
        
        return { 
          success: true, 
          data: {
            start_date: args.start_date,
            end_date: args.end_date,
            room_revenue: roomRevenue,
            fb_revenue: fbRevenue,
            other_revenue: otherRevenue,
            total_revenue: roomRevenue + fbRevenue + otherRevenue
          }
        };
      }

      case "get_audit_logs": {
        let query = supabase.from('audit_logs')
          .select('*')
          .eq('tenant_id', tenantId);
        
        if (args.entity_type) query = query.eq('entity_type', args.entity_type);
        
        const limit = args.limit || 20;
        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw error;
        return { success: true, data };
      }

      // ==================== SETTINGS ====================
      case "update_property_settings": {
        const updateData: any = {};
        if (args.tax_rate !== undefined) updateData.tax_rate = args.tax_rate;
        if (args.service_charge_rate !== undefined) updateData.service_charge_rate = args.service_charge_rate;
        if (args.currency !== undefined) updateData.currency = args.currency;
        if (args.timezone !== undefined) updateData.timezone = args.timezone;

        const { data, error } = await supabase.from('properties')
          .update(updateData)
          .eq('id', propertyId)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      // ==================== BULK OPERATIONS ====================
      case "bulk_create_rooms": {
        const results = [];
        const errors = [];
        
        for (const room of args.rooms) {
          try {
            // Check if room number already exists
            const { data: existingRoom } = await supabase.from('rooms')
              .select('room_number')
              .eq('tenant_id', tenantId)
              .eq('property_id', propertyId)
              .eq('room_number', room.room_number)
              .maybeSingle();
            
            if (existingRoom) {
              errors.push(`Room ${room.room_number} already exists, skipped`);
              continue;
            }
            
            const { data, error } = await supabase.from('rooms')
              .insert({
                tenant_id: tenantId,
                property_id: propertyId,
                room_number: room.room_number,
                room_type_id: room.room_type_id,
                floor: room.floor || null,
                status: 'vacant'
              })
              .select('*, room_types(name)')
              .single();
            
            if (error) {
              errors.push(`Failed to create room ${room.room_number}: ${error.message}`);
            } else {
              results.push(data);
            }
          } catch (e: any) {
            errors.push(`Failed to create room ${room.room_number}: ${e.message}`);
          }
        }
        
        if (results.length === 0 && errors.length > 0) {
          return { success: false, error: errors.join('; ') };
        }
        
        return { 
          success: true, 
          data: results,
          errors: errors.length > 0 ? errors : undefined
        };
      }

      case "bulk_create_guests": {
        const results = [];
        const errors = [];
        
        for (const guest of args.guests) {
          try {
            const { data, error } = await supabase.from('guests')
              .insert({
                tenant_id: tenantId,
                first_name: guest.first_name,
                last_name: guest.last_name,
                email: guest.email || null,
                phone: guest.phone || null,
                nationality: guest.nationality || null,
                is_vip: guest.is_vip || false
              })
              .select()
              .single();
            
            if (error) {
              errors.push(`Failed to create guest ${guest.first_name} ${guest.last_name}: ${error.message}`);
            } else {
              results.push(data);
            }
          } catch (e: any) {
            errors.push(`Failed to create guest ${guest.first_name} ${guest.last_name}: ${e.message}`);
          }
        }
        
        if (results.length === 0 && errors.length > 0) {
          return { success: false, error: errors.join('; ') };
        }
        
        return { 
          success: true, 
          data: results,
          errors: errors.length > 0 ? errors : undefined
        };
      }

      case "bulk_create_reservations_with_checkin": {
        const reservations = [];
        const checkedIn = [];
        const errors = [];
        
        for (const res of args.reservations) {
          try {
            // Get room type for rate
            const { data: roomType } = await supabase.from('room_types')
              .select('base_rate, name')
              .eq('id', res.room_type_id)
              .single();
            
            const checkIn = new Date(res.check_in_date);
            const checkOut = new Date(res.check_out_date);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            const ratePerNight = roomType?.base_rate || 3000;
            const totalAmount = nights * ratePerNight;
            
            // Get property code for confirmation number
            const { data: property } = await supabase.from('properties')
              .select('code')
              .eq('id', propertyId)
              .single();
            
            const confirmationNumber = await supabase.rpc('generate_confirmation_number', {
              property_code: property?.code || 'HTL'
            });
            
            // Create reservation
            const { data: reservation, error: resError } = await supabase.from('reservations')
              .insert({
                tenant_id: tenantId,
                property_id: propertyId,
                guest_id: res.guest_id,
                check_in_date: res.check_in_date,
                check_out_date: res.check_out_date,
                adults: res.adults || 1,
                children: 0,
                status: 'confirmed',
                source: 'direct',
                confirmation_number: confirmationNumber.data,
                total_amount: totalAmount,
                created_by: userId || null
              })
              .select('*, guests(first_name, last_name)')
              .single();
            
            if (resError) {
              errors.push(`Failed to create reservation: ${resError.message}`);
              continue;
            }
            
            // Create reservation_room entry
            await supabase.from('reservation_rooms').insert({
              tenant_id: tenantId,
              reservation_id: reservation.id,
              room_type_id: res.room_type_id,
              room_id: res.room_id || null,
              rate_per_night: ratePerNight,
              adults: res.adults || 1
            });
            
            reservations.push({
              ...reservation,
              nights,
              rate_per_night: ratePerNight
            });
            
            // Check in if requested
            if (res.should_check_in) {
              // Update reservation status
              await supabase.from('reservations')
                .update({
                  status: 'checked_in',
                  actual_check_in: new Date().toISOString()
                })
                .eq('id', reservation.id);
              
              // Assign room if provided
              if (res.room_id) {
                await supabase.from('reservation_rooms')
                  .update({ room_id: res.room_id })
                  .eq('reservation_id', reservation.id);
                
                await supabase.from('rooms')
                  .update({ status: 'occupied' })
                  .eq('id', res.room_id);
              }
              
              // Create folio
              const folioNumber = await supabase.rpc('generate_folio_number', {
                property_code: property?.code || 'HTL'
              });
              
              await supabase.from('folios').insert({
                tenant_id: tenantId,
                property_id: propertyId,
                guest_id: res.guest_id,
                reservation_id: reservation.id,
                folio_number: folioNumber.data,
                status: 'open'
              });
              
              checkedIn.push(reservation.confirmation_number);
            }
          } catch (e: any) {
            errors.push(`Failed to create reservation: ${e.message}`);
          }
        }
        
        if (reservations.length === 0 && errors.length > 0) {
          return { success: false, error: errors.join('; ') };
        }
        
        return { 
          success: true, 
          reservations,
          checked_in: checkedIn,
          errors: errors.length > 0 ? errors : undefined
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error: any) {
    console.error(`Tool execution error (${toolName}):`, error);
    return { success: false, error: error.message || 'Tool execution failed' };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, tenantId: clientTenantId, propertyId: clientPropertyId } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get('Authorization');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    let userId: string = '';
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || '';
    }

    // Server-side validation: Get user's tenant from their profile
    let validatedTenantId = clientTenantId;
    let validatedPropertyId = clientPropertyId;
    
    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .single();
      
      if (profileError || !profile?.tenant_id) {
        console.error('User profile not found or has no tenant:', profileError);
        throw new Error('User does not belong to a tenant');
      }
      
      // Use the tenant from the user's profile, not from client
      validatedTenantId = profile.tenant_id;
      
      // Validate that the property belongs to this tenant
      if (clientPropertyId) {
        const { data: property, error: propError } = await supabase
          .from('properties')
          .select('id, tenant_id')
          .eq('id', clientPropertyId)
          .single();
        
        if (propError || !property) {
          console.error('Property not found:', clientPropertyId);
          throw new Error('Invalid property ID');
        }
        
        if (property.tenant_id !== validatedTenantId) {
          console.error(`Security: Cross-tenant access attempt. User tenant: ${validatedTenantId}, Property tenant: ${property.tenant_id}`);
          
          // Log the cross-tenant access attempt to audit logs
          try {
            await supabase.rpc('log_cross_tenant_attempt', {
              p_user_id: userId,
              p_user_tenant_id: validatedTenantId,
              p_attempted_tenant_id: property.tenant_id,
              p_attempted_property_id: clientPropertyId,
              p_action_type: 'cross_tenant_property_access',
              p_details: {
                source: 'admin-chat',
                client_provided_tenant_id: clientTenantId,
                client_provided_property_id: clientPropertyId
              },
              p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
              p_user_agent: req.headers.get('user-agent') || null
            });
          } catch (logError) {
            console.error('Failed to log security event:', logError);
          }
          
          throw new Error('Property does not belong to your organization');
        }
        
        validatedPropertyId = property.id;
      }
    }
    
    const tenantId = validatedTenantId;
    const propertyId = validatedPropertyId;

    const hotelContext = await getHotelContext(supabase, tenantId);
    const fullSystemPrompt = baseSystemPrompt + hotelContext;

    // Maximum iterations for tool execution loop (handles multi-step operations)
    const MAX_TOOL_ITERATIONS = 5;
    let currentMessages: any[] = [...messages];
    let allToolCalls: any[] = [];
    let allToolResults: any[] = [];
    let allToolSummaries: string[] = [];
    let finalAssistantMessage: any = null;

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      console.log(`Tool iteration ${iteration + 1}/${MAX_TOOL_ITERATIONS}`);
      
      const response = await callAIWithRetry(LOVABLE_API_KEY, {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...currentMessages
        ],
        tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 8192  // Increased for bulk operations
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const assistantMessage = aiResponse.choices?.[0]?.message;

      if (!assistantMessage) {
        throw new Error("No response from AI");
      }

      // If no tool calls, we're done
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        finalAssistantMessage = assistantMessage;
        break;
      }

      // Execute all tool calls in this iteration
      const iterationToolResults = [];
      const iterationToolSummaries = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool (iteration ${iteration + 1}): ${toolName}`, toolArgs);
        
        const result = await executeTool(
          toolName, 
          toolArgs, 
          supabase, 
          tenantId, 
          propertyId,
          userId
        );
        
        const summary = generateToolSummary(toolName, toolArgs, result);
        iterationToolSummaries.push(summary);
        allToolSummaries.push(summary);
        
        const toolResult = {
          tool_call_id: toolCall.id,
          role: "tool",
          content: JSON.stringify({
            ...result,
            _summary: summary
          })
        };
        
        iterationToolResults.push(toolResult);
        allToolResults.push({
          name: toolName,
          args: toolArgs,
          result,
          summary
        });
        
        allToolCalls.push({
          name: toolName,
          args: toolArgs
        });
      }

      // Add assistant message and tool results to current messages for next iteration
      currentMessages.push(assistantMessage);
      currentMessages.push(...iterationToolResults);
      
      console.log(`Iteration ${iteration + 1} completed: ${assistantMessage.tool_calls.length} tools executed`);
    }

    // Generate final response
    if (allToolCalls.length > 0) {
      // Get a final summary from the AI
      const finalResponse = await callAIWithRetry(LOVABLE_API_KEY, {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt + `\n\nIMPORTANT: The following tool(s) were executed across multiple steps. Summarize ALL actions taken in a friendly, comprehensive response:\n\n${allToolSummaries.join('\n\n')}` },
          ...currentMessages
        ],
        temperature: 0.7,
        max_tokens: 8192
      });

      if (!finalResponse.ok) {
        const errorText = await finalResponse.text();
        console.error("Final AI response error:", errorText);
        
        // Return summaries directly if AI fails
        return new Response(JSON.stringify({
          message: allToolSummaries.join('\n\n'),
          toolCalls: allToolCalls,
          toolResults: allToolResults.map(tr => ({ ...tr.result, _summary: tr.summary }))
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const finalData = await finalResponse.json();
      const finalMessage = finalData.choices?.[0]?.message;

      return new Response(JSON.stringify({
        message: finalMessage?.content || allToolSummaries.join('\n\n'),
        toolCalls: allToolCalls,
        toolResults: allToolResults.map(tr => ({ ...tr.result, _summary: tr.summary }))
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No tool calls at all - check for hallucination
    const responseContent = (finalAssistantMessage?.content || '').toLowerCase();
    const creationPatterns = [
      'i have created', 'i\'ve created', 'created successfully',
      'i have added', 'i\'ve added', 'added successfully',
      'i have made', 'i\'ve made', 'made successfully',
      'i have deleted', 'i\'ve deleted', 'deleted successfully',
      'i have updated', 'i\'ve updated', 'updated successfully',
      'room has been created', 'reservation has been created',
      'guest has been created', 'successfully created',
      'তৈরি করেছি', 'সম্পন্ন হয়েছে', 'করা হয়েছে', 'মুছে ফেলেছি'
    ];
    
    const claimsAction = creationPatterns.some(pattern => responseContent.includes(pattern));
    
    if (claimsAction) {
      console.warn('HALLUCINATION DETECTED: AI claimed action without tool calls. Original response:', finalAssistantMessage?.content);
      
      return new Response(JSON.stringify({
        message: "আমি বুঝতে পারছি আপনি কিছু করতে চাইছেন। তবে, আমাকে প্রথমে বিস্তারিত জানাতে হবে:\n\n1. **কী করতে চাইছেন?** (তৈরি/আপডেট/মুছে ফেলা)\n2. **প্রয়োজনীয় তথ্য** (রুম নম্বর, গেস্টের নাম, তারিখ ইত্যাদি)\n\nনিশ্চিত করার পর আমি কাজটি সম্পন্ন করব।",
        warning: "Action requires confirmation",
        toolCalls: [],
        toolResults: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      message: finalAssistantMessage?.content || "I'm ready to help. What would you like to do?",
      toolCalls: [],
      toolResults: []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Admin chat error:", error);
    return new Response(JSON.stringify({
      error: error.message || "An error occurred",
      message: `দুঃখিত, একটি সমস্যা হয়েছে: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
