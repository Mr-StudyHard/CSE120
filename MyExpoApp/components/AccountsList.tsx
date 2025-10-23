import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import db, { Account } from "../utils/db";

export const AccountsList: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);

  const load = async () => {
    try {
      const all = await db.getAllAccounts();
      setAccounts(all);
    } catch (err) {
      console.error("Failed to load accounts", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View className="p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-button-outline text-xl font-extrabold">Stored Accounts</Text>
        {onClose ? (
          <TouchableOpacity onPress={onClose} className="px-3 py-1 border rounded">
            <Text className="text-button-outline">Close</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="mb-3 p-3 bg-card-bg rounded">
            <Text className="text-white">Email: {item.email}</Text>
            <Text className="text-gray-400">Password: {item.password}</Text>
            <Text className="text-gray-400 text-sm">Created: {new Date(item.created_at).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text className="text-gray-400">No accounts stored yet.</Text>
        )}
      />
    </View>
  );
};

export default AccountsList;
