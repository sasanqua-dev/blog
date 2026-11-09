---
title: "使いたくなるUIを使える「shadcn/ui」の話"
description: ""
pubDate: "2023-08-14"
---

個人用のアプリを作ってたところ「shadcn/ui」に出会ってテンション上がったので記事にまとめてみました、さざんかです

# shadcn/ui とは？

> 公式サイトより
> This is NOT a component library. It's a collection > of re-usable components that you can copy and paste > into your apps.
>
>What do you mean by not a component library?
>
>I mean you do not install it as a dependency. It is >not available or distributed via npm.

**ざっくり翻訳**

これはコンポーネント・ライブラリではありません。あなたのアプリにコピー＆ペーストできる再利用可能なコンポーネントのコレクションです。

コンポーネント・ライブラリではないとは依存関係としてインストールしないという意味です。npm経由で利用することも配布することもできません。

すなわちMUIなどと違ってnpm installだけでは使えないみたいです
(この意味を理解して使えるようになるまでに2時間かかった...)

# どんなUIが作れるのか？

公式サイトにデモが載ってるので一度触ってみることをお勧めします
html/cssを直に書く実装してしてこなくてReact初心者だった自分は感激しました

https://ui.shadcn.com/

# 詰まったところ

## 1. components.jsonとはなんぞや

前述の通りshadcnはnpmだけで動くわけではないのでいろいろ設定してあげる必要があります

shadcn/uiではcomponents.jsonで諸々管理しています
(おそらくnodeのpackege.json的な位置どころ...?)

このファイルがないと何もできないので次のコマンドで作ってあげる必要があります

```
npx install shadcn-ui@latest init
```

いろいろ聞かれるので自分の環境に合わせて設定してください

## 2. プレフィックス...?


```
ERROR in ./src/components/ui/button.jsx 7:0-33
Module not found: Error: Can't resolve '@/lib/utils' in '/usr/src/app/frontend/src/components/ui'

ERROR in ./src/components/ui/input.jsx 5:0-33
Module not found: Error: Can't resolve '@/lib/utils' in '/usr/src/app/frontend/src/components/ui'

ERROR in ./src/components/ui/label.jsx 9:0-33
Module not found: Error: Can't resolve '@/lib/utils' in '/usr/src/app/frontend/src/components/ui'

ERROR in ./src/components/ui/sheet.jsx 10:0-33
Module not found: Error: Can't resolve '@/lib/utils' in '/usr/src/app/frontend/src/components/ui'

```

ご存じの方からすると「何言ってるんだこいつ...?」と思われるかもしれませんが、import文で使用されている「@/」を参照できるように設定が必要です

（Dockerから対象のERRORが出たときは泣きたくなりました）

```
{
    "compilerOptions": {
        "baseUrl": "./src"
    }
}

```

> **注意:**
> pathsを設定する方法が一般的です
> この方法では関連するファイルのimport文すべてからプレフィックスを取り除く必要があります
> 
> 今回は個人用かつ動けばいいで開発したのでこのまま進めましたjsを使っている方は「jsconfig.json」、TypeScriptを使っている方は「tsconfig.json」で上記のように設定してあげる必要があります

# 終わりに

使い始めるまでにつまずいたところがありましたが使いこなせば手軽にセンスのいいUIが作れそうです

Dockerコンテナのビルドに時間がかかっていたのでマークダウンへの慣れもかねて記事を書いてみました

ここまでお付き合いいただきありがとうございました！
