"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

interface TdacRecord {
  id: number;
  first_name: string;
  family_name: string;
  sex: string;
  nationality: string;
  date_of_birth: string;
  place_of_birth: string;
  passport_number: string;
  arrival_date: string;
  flight_number: string;
  departure_airport: string;
  departure_country: string;
  arrival_airport: string;
  arrival_city: string;
  agency: string;
  is_paid: number;
  is_finished: number;
  create_date: string;
  update_date: string;
}

export default function Home() {
  const [data, setData] = useState<TdacRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [finishedCount, setFinishedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("tdac_token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/tdac?page=${currentPage}&pageSize=${pageSize}&token=${token}`)
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("tdac_token");
          setToken(null);
          setAuthError("访问码无效");
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((result) => {
        if (!result) return;
        setData(result.data || []);
        setTotal(result.total || 0);
        setFinishedCount(result.finishedCount || 0);
        setIsAdmin(result.isAdmin || false);
        setPendingCount(result.pendingCount || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentPage, token]);

  const totalPages = Math.ceil(total / pageSize);

  const handleLogin = () => {
    setAuthError("");
    localStorage.setItem("tdac_token", tokenInput);
    setToken(tokenInput);
    setCurrentPage(1);
  };

  const handleLogout = () => {
    localStorage.removeItem("tdac_token");
    setToken(null);
    setData([]);
    setTotal(0);
    setTokenInput("");
  };

  if (!mounted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-sm p-8">
          <div className="flex flex-col items-center mb-6"><img src="/logo.png" alt="logo" className="w-24 h-24 mb-3" /><h1 className="text-2xl font-bold">保关系统</h1></div>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="请输入访问码"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full rounded-md border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-900 dark:border-gray-700"
            />
            {authError && <p className="text-sm text-red-500">{authError}</p>}
            <button
              onClick={handleLogin}
              className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              进入
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-100 dark:bg-gray-900">
      <main className="flex-1 min-h-screen">
        <div className="p-4 md:p-8 space-y-4 md:space-y-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              TDAC 旅客信息
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              退出
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border bg-white p-4 md:p-6 shadow-sm dark:bg-gray-950">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-sm font-medium text-gray-500">总记录数</span>
              </div>
              <div className="text-xl md:text-2xl font-bold">{total}</div>
            </div>
            <div className="rounded-xl border bg-white p-4 md:p-6 shadow-sm dark:bg-gray-950">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-sm font-medium text-gray-500">已完成</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-green-600">{finishedCount}</div>
            </div>
            <div className="rounded-xl border bg-white p-4 md:p-6 shadow-sm dark:bg-gray-950">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-sm font-medium text-gray-500">待处理</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm dark:bg-gray-950 overflow-hidden">
            <div className="p-4 md:p-6">
              <h2 className="text-lg font-semibold">旅客列表</h2>
            </div>
            {loading ? (
              <div className="p-6 text-center text-gray-500">加载中...</div>
            ) : data.length === 0 ? (
              <div className="p-6 text-center text-gray-500">暂无数据</div>
            ) : (
              <div className="border-t overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {isAdmin && <th className="px-2 md:px-4 py-3 text-left font-medium text-gray-500">ID</th>}
                      <th className="px-2 md:px-4 py-3 text-left font-medium text-gray-500">姓名</th>
                      <th className="px-2 md:px-4 py-3 text-left font-medium text-gray-500">性别</th>
                      <th className="px-2 md:px-4 py-3 text-left font-medium text-gray-500">入境日期</th>
                      {isAdmin && <th className="px-2 md:px-4 py-3 text-left font-medium text-gray-500">代理</th>}
                      <th className="px-2 md:px-4 py-3 text-left font-medium text-gray-500">状态</th>
                      <th className="px-2 md:px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">创建时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {data.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        {isAdmin && <td className="px-2 md:px-4 py-3">{record.id}</td>}
                        <td className="px-2 md:px-4 py-3 font-medium">{[record.family_name, record.first_name].filter(Boolean).join(' ')}</td>
                        <td className="px-2 md:px-4 py-3">{record.sex === 'male' ? '男' : '女'}</td>
                        <td className="px-2 md:px-4 py-3">{record.arrival_date?.slice(5)}</td>
                        {isAdmin && <td className="px-2 md:px-4 py-3">{record.agency}</td>}
                        <td className="px-2 md:px-4 py-3">
                          {record.is_finished ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-200">
                              已完成
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                              待处理
                            </span>
                          )}
                        </td>
                        <td className="px-2 md:px-4 py-3 text-gray-500 hidden md:table-cell">{record.create_date?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t px-4 md:px-6 py-4">
              <div className="text-sm text-gray-500">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="inline-flex items-center rounded-md border px-2 md:px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">上一页</span>
                </button>
                <button
                  className="inline-flex items-center rounded-md border px-2 md:px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span className="hidden sm:inline">下一页</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
