"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  fetchCurrentUser,
  logout,
} from "@/lib/auth";

import {
  createConversation,
  getConversations,
  getConversation,
  updateConversationTitle,
} from "@/lib/conversation";

import { sendMessage } from "@/lib/chat";

import ConversationSidebar from "@/components/conversation/ConversationSidebar";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import SandboxPanel from "@/components/sandbox/SandboxPanel";

export default function ChatPage() {

  const router = useRouter();

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [
    conversations,
    setConversations,
  ] = useState<any[]>([]);

  const [
    selectedConversation,
    setSelectedConversation,
  ] = useState<string | null>(
    null
  );

  const [messages, setMessages] =
    useState<any[]>([]);

  const [sending, setSending] =
    useState(false);

  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  useEffect(() => {

    const loadData =
      async () => {

        try {

          const token =
            localStorage.getItem(
              "token"
            );

          if (!token) {

            router.push(
              "/auth/login"
            );

            return;
          }

          const userData =
            await fetchCurrentUser();

          if (!userData.success) {

            logout();

            return;
          }

          setUser(
            userData.user
          );

          const conversationsData =
            await getConversations();

          if (
            conversationsData.success
          ) {

            setConversations(
              conversationsData.conversations
            );

            if (
              conversationsData
                .conversations
                .length > 0
            ) {

              setSelectedConversation(
                conversationsData
                  .conversations[0]
                  .id
              );
            }
          }

        } catch (error) {

          console.error(
            error
          );

          logout();

        } finally {

          setLoading(
            false
          );
        }
      };

    loadData();

  }, [router]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) {
        setMessages([]);
        return;
      }
      try {
        const data = await getConversation(selectedConversation);
        if (data.success && data.conversation) {
          setMessages(data.conversation.messages || []);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [selectedConversation]);

  const handleNewConversation =
    async () => {

      try {

        const data =
          await createConversation();

        if (
          data.success
        ) {

          const updated =
            await getConversations();

          setConversations(
            updated.conversations
          );

          setSelectedConversation(
            data.conversation.id
          );

          setMessages([]);
        }

      } catch (error) {

        console.error(
          error
        );
      }
    };

  const handleSendMessage =
    async (
      text: string
    ) => {

      if (
        !selectedConversation ||
        !text.trim()
      ) {
        return;
      }

      const userMessage = {
        role: "user",
        content: text,
      };

      setMessages(
        (prev) => [
          ...prev,
          userMessage,
        ]
      );

      setSending(true);

      try {

        const response =
          await sendMessage(
            text,
            selectedConversation
          );

        const reader =
          response.body?.getReader();

        if (!reader) {
          return;
        }

        const decoder =
          new TextDecoder();

        let assistantText =
          "";

        setMessages(
          (prev) => [
            ...prev,
            {
              role:
                "assistant",
              content: "",
            },
          ]
        );

        while (true) {

          const {
            done,
            value,
          } =
            await reader.read();

          if (done) break;

          assistantText +=
            decoder.decode(
              value
            );

          setMessages(
            (prev) => {

              const updated =
                [...prev];

              updated[
                updated.length - 1
              ] = {
                role:
                  "assistant",
                content:
                  assistantText,
              };

              return updated;
            }
          );
        }

        // If it was a new conversation, refetch the conversation list to load the AI-generated summary title
        const currentConversation = conversations.find(
          (c) => c.id === selectedConversation
        );
        if (
          currentConversation &&
          currentConversation.title === "New Conversation"
        ) {
          const updated = await getConversations();
          if (updated.success) {
            setConversations(updated.conversations);
          }
        }

      } catch (error) {

        console.error(
          error
        );

      } finally {

        setSending(
          false
        );
      }
    };

  const refreshUser = async () => {
    try {
      const userData = await fetchCurrentUser();
      if (userData.success) {
        setUser(userData.user);
      }
    } catch (error) {
      console.error("Failed to refresh user profile data:", error);
    }
  };

  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const isThinking =
    sending &&
    (messages.length === 0 ||
      messages[messages.length - 1].role === "user" ||
      (messages[messages.length - 1].role === "assistant" &&
        !messages[messages.length - 1].content));

  return (
    <main className="h-screen flex">

      <ConversationSidebar
        conversations={
          conversations
        }
        selectedConversation={
          selectedConversation
        }
        onSelect={
          setSelectedConversation
        }
        onCreate={
          handleNewConversation
        }
        user={user}
        onRefreshUser={refreshUser}
      />

      <section className="flex-1 flex flex-col">

        <div className="border-b p-4 flex justify-between items-center">

          <div>

            <h2 className="font-semibold text-lg">
              AgentDesk
            </h2>

            <p className="text-sm text-zinc-500">
              {user?.email}
            </p>

          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsSandboxOpen(true)}
              className="bg-zinc-100 hover:bg-zinc-200 border rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition"
            >
              🛠️ Sandbox
            </button>

            <button
              onClick={logout}
              className="border hover:bg-zinc-50 rounded-xl px-4 py-2 text-sm font-semibold transition"
            >
              Logout
            </button>
          </div>

        </div>

        <ChatMessages
          messages={messages}
          isThinking={isThinking}
        />

        <ChatInput
          onSend={
            handleSendMessage
          }
          disabled={sending}
        />

      </section>

      <SandboxPanel isOpen={isSandboxOpen} onClose={() => setIsSandboxOpen(false)} onDataSeeded={refreshUser} user={user} />
    </main>
  );
}