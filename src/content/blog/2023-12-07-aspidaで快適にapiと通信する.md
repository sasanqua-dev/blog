---
title: "aspidaで快適にAPIと通信する"
description: ""
pubDate: "2023-12-07"
---

# そのAPIの型、定義されていますか？

フロントエンドで「型定義」といったらTypeScriptが思い浮かぶ人がほとんどではないでしょうか
宣言されている変数は型定義のおかげで意図しない値の代入を防げているでしょう

**では、APIの返り値の型はどうですか？ anyにしてませんか？**

せっかく、TypeScriptを導入したにも関わらずanyを多用してしまっている...なんてことを防いでくれるライブラリ「aspida」を紹介します！

# Aspidaが担ってくれること

> パス・URL クエリ・ヘッダー・ボディ・レスポンス全てに型を指定可能
> FormData / URLSearchParams の内容にも型を指定可能
> HTTP クライアントは axios / fetch / node-fetch に対応
> 
> READMEより
> https://github.com/aspida/aspida/tree/main/packages/aspida/docs/ja#readme

実際にAspidaは以下のように型定義をしてくれます

```typescript
import type { DefineMethods } from "aspida";

type User = {
  id: number;
  name: string;
};

export type Methods = DefineMethods<{
  get: {
    query?: {
      limit: number;
    };

    resBody: User[];
  };

  post: {
    reqBody: {
      name: string;
    };

    resBody: User;
    /**
     * reqHeaders(?): ...
     * reqFormat: ...
     * status: ...
     * resHeaders(?): ...
     * polymorph: [...]
     */
  };
}>;
```

さらにaspidaではパスとディレクトリ構造を一致させてくれます
例えば、APIのパスが __https://example-api.com/users?limit={number}__ の形式の場合は
```
- myproject
    - api
        - users
            - index.ts
```
のようにディレクトリを作ります
これが、パスが増えていくと
```
- myproject
    - api
        - users
            - index.ts
        - content
            - index.ts
        - action
            - post
                - index.ts
        ・・・
```
のように複雑なパスになっても可読性を保ったまま開発することができます！

ちなみに最初の例の場合のAPIを呼び出すコードは以下の通りです
```typescript
// 公式サイトより
import aspida from "@aspida/axios";
import api from "../api/$api";
(async () => {
  const userId = 0;
  const limit = 10;
  const client = api(aspida());

  await client.v1.users.post({ body: { name: "taro" } });

  const res = await client.v1.users.get({ query: { limit } });
  console.log(res);
  // req -> GET: /v1/users/?limit=10
  // res -> { status: 200, body: [{ id: 0, name: "taro" }], headers: {...} }

  const user = await client.v1.users._userId(userId).$get();
  console.log(user);
  // req -> GET: /v1/users/0
  // res -> { id: 0, name: "taro" }
})();
```

このように型定義だけではなく、パスの面倒や毎回APIのURL/パスを書いて「どこかでタイプミスしてた...」なんてことからも救ってくれます

# Aspidaの導入手順

npmからインストールできます
手順は公式リポジトリのReadMeで解説されているので割愛します

https://github.com/aspida/aspida/tree/main/packages/aspida/docs/ja#readme

# Aspidaで気を付けること

## aspidaのビルドが必要

アプリケーションでaspidaを使うためにはaspidaのビルドが必要です
```json
// package.json
{
  "scripts": {
    "api:build": "aspida"
  }
}
```
```bash
$ npm run api:build

> api/$api.ts was built successfully.
```

> **メモ:**
> Nuxtなどですでにnpmを使っている場合はpackage.jsonのscriptsの部分のdevなどにaspidaのコマンドを入れて
> ```json
> {
>   "scripts": {
>     "dev": "aspida && nuxt "
>   }
> }
> 
> ```
> などにすると個々でコマンドを実行することができます！

# aspidaを実際のプロダクトで使ってよかったこと

- 引数を入れ忘れない
- アプリケーション側のコードの可読性が上がった

aspidaがあることで引数が足りなかったり型が違ったりしたときにエラーを吐いてくれるのでAPI側でのエラーが大幅に減りました
また、それぞれの場所でaxiosでAPIコールするよりもaspidaを使ったほうが読みやすいです(切実)

# 終わりに

これからも便利なライブラリや新しい技術を積極的に取り入れて楽にコーディングをしたいですね！
