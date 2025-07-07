import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return settings (mask API key for security)
    const settings = user.settings;
    const response = {
      openaiApiKey: settings?.openaiApiKey ? 
        settings.openaiApiKey.slice(-8) : null, // Return only last 8 chars for verification
      theme: settings?.theme || "dark",
      notifications: settings?.notifications || true,
      defaultCurrency: settings?.defaultCurrency || "USD"
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { openaiApiKey, theme, notifications, defaultCurrency } = body;

    // Validate OpenAI API key format if provided
    if (openaiApiKey !== null && openaiApiKey !== undefined) {
      if (typeof openaiApiKey !== "string") {
        return NextResponse.json(
          { error: "Invalid API key format" },
          { status: 400 }
        );
      }

      if (openaiApiKey.length > 0 && !openaiApiKey.startsWith("sk-")) {
        return NextResponse.json(
          { error: "OpenAI API key must start with 'sk-'" },
          { status: 400 }
        );
      }

      if (openaiApiKey.length > 0 && openaiApiKey.length < 20) {
        return NextResponse.json(
          { error: "Invalid API key length" },
          { status: 400 }
        );
      }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (openaiApiKey !== undefined) {
      updateData.openaiApiKey = openaiApiKey || null;
    }
    if (theme !== undefined) {
      updateData.theme = theme;
    }
    if (notifications !== undefined) {
      updateData.notifications = notifications;
    }
    if (defaultCurrency !== undefined) {
      updateData.defaultCurrency = defaultCurrency;
    }

    // Update or create user settings
    const existingSettings = user.settings;
    
    if (existingSettings) {
      // Update existing settings
      await prisma.userSettings.update({
        where: { id: existingSettings.id },
        data: updateData
      });
    } else {
      // Create new settings
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          ...updateData
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Settings updated successfully" 
    });

  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}