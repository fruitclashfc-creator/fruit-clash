import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case "delete_user": {
        const { user_id } = params;
        // Delete from auth (cascades to profiles, inventory, etc.)
        const { error } = await adminClient.auth.admin.deleteUser(user_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_user": {
        const { username, password, name, level, total_wins, thunder_points, gems } = params;
        const email = `${username.toLowerCase().replace(/\s+/g, "_")}@fruitclash.local`;
        
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name: name || username },
        });
        if (createError) throw createError;

        // Update profile with specified stats
        if (newUser.user) {
          // Wait for trigger to create profile
          await new Promise((r) => setTimeout(r, 1000));
          
          await adminClient
            .from("profiles")
            .update({
              name: name || username,
              level: level || 1,
              total_wins: total_wins || 0,
              thunder_points: thunder_points || 100,
              gems: gems || 10,
            })
            .eq("user_id", newUser.user.id);
        }

        return new Response(JSON.stringify({ success: true, user_id: newUser.user?.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_player": {
        const { user_id, updates } = params;
        const { error } = await adminClient
          .from("profiles")
          .update(updates)
          .eq("user_id", user_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add_fighter": {
        const { user_id, fighter_id } = params;
        // Check existing
        const { data: existing } = await adminClient
          .from("player_inventory")
          .select("id, quantity")
          .eq("user_id", user_id)
          .eq("item_id", fighter_id)
          .eq("item_type", "fighter")
          .maybeSingle();

        if (existing) {
          if (existing.quantity < 15) {
            await adminClient
              .from("player_inventory")
              .update({ quantity: existing.quantity + 1 })
              .eq("id", existing.id);
          }
        } else {
          await adminClient
            .from("player_inventory")
            .insert({ user_id, item_id: fighter_id, item_type: "fighter", quantity: 1 });
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "grant_all_fighters": {
        const { user_id, fighter_ids } = params;
        for (const fid of fighter_ids) {
          const { data: existing } = await adminClient
            .from("player_inventory")
            .select("id")
            .eq("user_id", user_id)
            .eq("item_id", fid)
            .eq("item_type", "fighter")
            .maybeSingle();

          if (!existing) {
            await adminClient
              .from("player_inventory")
              .insert({ user_id, item_id: fid, item_type: "fighter", quantity: 1 });
          }
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "remove_fighter": {
        const { user_id, fighter_id } = params;
        await adminClient
          .from("player_inventory")
          .delete()
          .eq("user_id", user_id)
          .eq("item_id", fighter_id)
          .eq("item_type", "fighter");
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_players": {
        const { data, error } = await adminClient
          .from("profiles")
          .select("*")
          .order("total_wins", { ascending: false });
        if (error) throw error;
        
        // Get inventory counts
        const { data: inventoryData } = await adminClient
          .from("player_inventory")
          .select("user_id, item_id, quantity");

        return new Response(JSON.stringify({ players: data, inventory: inventoryData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "change_password": {
        const { user_id, new_password } = params;
        const { error } = await adminClient.auth.admin.updateUserById(user_id, {
          password: new_password,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
