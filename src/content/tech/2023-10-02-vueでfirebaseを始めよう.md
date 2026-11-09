---
title: "VueでFirebaseを始めよう！"
description: ""
pubDate: "2023-10-02"
---

# VueでFirebaseを始めよう！①

ちょっとしたことを毎日残す100日チャレンジ　１日目

### firebaseをVueで使うためのconfigとか、定義はどこに配置するのか

```typescript

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
};

export const firebaseapp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseapp);
```

### ほかのファイルからの読み込み

```typescript
import { firebase, auth } from "../../main"; // main.tsへの相対パス
```
