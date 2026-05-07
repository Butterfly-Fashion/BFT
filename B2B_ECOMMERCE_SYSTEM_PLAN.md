# B2B 이커머스 시스템 기획서

## 1. 시스템 목표

이 시스템은 오프라인 B2B 고객을 온라인 주문, 견적, 결제로 전환하는 플랫폼이다.

일반적인 쇼핑몰처럼 고객이 바로 결제하는 구조가 아니라, 기존 고객 기반의 B2B 거래 특성을 반영한다.

- 기존 고객 중심 운영
- 고객별 가격 적용 가능
- 가격 협상 가능
- 재고 수동 확인
- 관리자 승인 후 결제
- Pickup 또는 Shipping 처리

한 줄로 요약하면:

> 고객은 주문 요청만 하고, 관리자가 조건을 확정한 뒤 결제를 받는 B2B 최적화 Shopify-lite 시스템

## 2. 핵심 비즈니스 구조

### 일반 쇼핑몰 방식이 아닌 이유

이 비즈니스는 Shopify식 즉시 결제 구조와 맞지 않는다.

즉시 결제를 받으면 다음 문제가 생길 수 있다.

- 실제 재고가 없을 수 있음
- 고객마다 가격이 다를 수 있음
- 대량 주문은 가격 협상이 필요할 수 있음
- 배송비를 수동으로 확인해야 할 수 있음
- 결제 후 취소/환불 위험이 커짐

따라서 이 시스템은 승인 기반 결제 구조를 사용한다.

### 최종 주문 흐름

1. 고객 로그인
2. 상품 선택
3. 장바구니에 상품 추가
4. 주문 요청 제출
5. 주문 상태가 `Pending Review`가 됨
6. 관리자가 주문 검토
7. 관리자가 재고, 가격, 수량, 배송비, 세금 확인
8. 관리자가 주문 승인
9. Stripe 결제 링크 생성
10. 고객에게 결제 링크 발송
11. 고객 결제
12. Stripe webhook으로 결제 확인
13. 주문 상태가 `Paid`가 됨
14. 인보이스 생성
15. 고객과 관리자에게 이메일 발송
16. 관리자가 Pickup 또는 Shipping으로 처리

## 3. 사용자 유형

### Guest

로그인하지 않은 방문자.

가능한 기능:

- 상품 보기
- 상품 검색
- 상품 상세 확인
- 문의 또는 견적 요청

제한:

- 주문 요청 제출 제한 가능
- 고객별 가격 미적용

### Customer

회원가입 또는 로그인한 일반 고객.

가능한 기능:

- 상품 보기
- 장바구니 사용
- 주문 요청 제출
- 주문 상태 확인

### Approved B2B Customer

관리자가 승인한 B2B 고객.

가능한 기능:

- 주문 요청 제출
- 고객별 가격 적용
- 빠른 재주문
- 대량 주문 요청

### Admin

관리자.

가능한 기능:

- 주문 관리
- 주문 승인
- 결제 링크 생성
- 고객 관리
- 고객별 가격 관리
- 상품 관리
- 견적 관리
- 상태 변경

## 4. 가격 구조

B2B에서는 고객마다 가격이 다를 수 있으므로 세 가지 가격 개념이 필요하다.

### 1. Base Price

상품의 기본 가격.

로그인하지 않은 고객이나 고객별 가격이 없는 경우 보여주는 기준 가격이다.

### 2. Customer-specific Price

특정 고객에게만 적용되는 가격.

예:

- 도매 고객 가격
- VIP 고객 가격
- 반복 구매 고객 가격
- 특정 업체 전용 가격

### 3. Quote Price

관리자가 주문 검토 후 최종 확정하는 가격.

대량 주문, 특별 요청, 배송 조건 등에 따라 관리자가 최종 단가를 수정할 수 있다.

### 가격 적용 로직

로그인하지 않은 고객:

```text
base_price 적용
```

로그인한 고객:

```text
customer_price가 있으면 customer_price 적용
없으면 base_price 적용
```

관리자 검토 후:

```text
관리자가 최종 unit price를 확정
order_items.unit_price_snapshot에 저장
```

중요 원칙:

- 상품의 기본 가격은 주문 수정으로 바뀌면 안 된다.
- 주문 당시의 가격은 반드시 snapshot으로 저장한다.
- 이후 상품 가격이 바뀌어도 기존 주문 금액은 유지되어야 한다.

## 5. 재고 전략

초기 MVP에서는 복잡한 자동 재고 관리를 하지 않는다.

대신 상품 상태만 관리한다.

### 상품 상태

- `Available`
- `Limited`
- `Manual Confirm`
- `Hidden`

### 고객 안내 문구

```text
Availability will be confirmed after order review.
```

또는:

```text
Availability and final pricing will be confirmed before payment.
```

## 6. 배송 구조

### MVP 배송 옵션

- Pickup
- Shipping

### 배송 처리 흐름

1. 고객이 Pickup 또는 Shipping 선택
2. Shipping 선택 시 주소 입력
3. 주문 요청 제출
4. 관리자가 주소와 배송비 확인
5. 관리자가 배송비를 주문에 반영
6. 결제 링크 생성
7. 결제 후 배송 또는 Pickup 처리

### 배송 라벨 전략

초기에는 UPS/Canada Post API 자동 연동을 하지 않는다.

초기 MVP에서는:

- 관리자가 주소 확인
- 관리자가 배송비 확인
- 필요 시 수동으로 라벨 생성
- 이후 단계에서 Admin 버튼 기반 라벨 생성 기능 추가

자동 라벨 생성을 미루는 이유:

- 재고 확인 필요
- 주소 오류 방지
- 배송비 통제
- 초기 개발 범위 축소

## 7. 결제 구조

### 핵심 전략

고객은 바로 결제하지 않는다.

관리자가 주문을 승인한 후 결제 링크를 생성한다.

### Stripe 사용 방식

1. Admin이 주문 승인
2. Admin이 `Create Payment Link` 클릭
3. 서버에서 Stripe Checkout Session 또는 Payment Link 생성
4. 주문에 payment link 저장
5. 고객에게 결제 링크 전달
6. 고객 결제
7. Stripe webhook이 결제 완료 확인
8. 주문 상태를 `Paid`로 변경

중요:

- Stripe secret key는 절대 frontend에 노출하지 않는다.
- 결제 링크 생성은 반드시 backend에서 처리한다.

### Stripe key가 없을 때

개발 환경이나 초기 MVP에서는 `STRIPE_SECRET_KEY`가 없을 수 있다.

이 경우:

- 앱이 죽으면 안 된다.
- fallback invoice/order link를 저장한다.
- 관리자에게 수동 발송용 링크로 보여준다.
- UI에는 자동 이메일 발송처럼 표현하지 않는다.

권장 문구:

```text
Copy and send manually
```

## 8. 주문 상태 설계

주문 상태는 다음 값을 사용한다.

- `Pending Review`
- `Approved`
- `Payment Link Sent`
- `Paid`
- `Processing`
- `Ready for Pickup`
- `Label Created`
- `Shipped`
- `Completed`
- `Cancelled`
- `Refunded`

### 상태 흐름 예시

```text
Pending Review
→ Approved
→ Payment Link Sent
→ Paid
→ Processing
→ Ready for Pickup 또는 Shipped
→ Completed
```

## 9. 결제 상태 설계

결제 상태는 주문 상태와 별도로 관리할 수 있다.

- `Unpaid`
- `Payment Link Sent`
- `Paid`
- `Refunded`
- `Failed`

## 10. 인보이스

인보이스는 결제 완료 후 Paid Invoice로 표시되어야 한다.

결제 전에는 Invoice가 아니라 Order Request Summary로 보여야 한다.

### 결제 전 제목

```text
Order request summary
```

안내 문구:

```text
This is not a paid invoice yet.
```

### 결제 후 제목

```text
Invoice
```

### 인보이스에 포함될 정보

- 주문 번호
- 고객 정보
- 회사명
- 상품명 snapshot
- 단가 snapshot
- 수량
- subtotal
- discount
- shipping
- HST
- total
- payment status
- fulfillment method
- shipping address

## 11. 관리자 페이지

관리자 페이지는 마케팅 대시보드가 아니라 운영 데스크처럼 보여야 한다.

### Dashboard

필요 정보:

- 전체 주문 수
- Pending Review 수
- Approved 수
- Payment Link Sent 수
- Paid 수
- 매출 요약
- 견적 요청 수

### 주문 관리

필수 기능:

- 주문 목록 보기
- Pending Review 강조
- 주문 상세 열기
- 상품 수량 수정
- 단가 수정
- 배송비 수정
- HST 수정
- discount 수정
- 관리자 메모 작성
- 주문 승인
- 결제 링크 생성
- 결제 링크 복사
- 상태 변경

### 상품 관리

향후 필요 기능:

- 상품 생성
- 상품 수정
- 상품 숨김 처리
- 이미지 관리
- base price 수정
- availability status 변경
- bulk order 가능 여부 설정

초기 MVP에서는 CSV 기반 상품 로딩을 유지하고, 완전한 상품 CRUD는 다음 단계로 미룰 수 있다.

### 고객 관리

필수 개념:

- 고객 정보
- 회사명
- 고객 유형
- B2B 승인 여부
- 메모
- 고객별 가격

고객 유형 예시:

- Retail
- B2B
- Wholesale
- VIP
- Lead

### 견적 관리

향후 필요 기능:

- 견적 요청 보기
- 가격 제안
- 상태 관리
- 주문으로 전환

초기 MVP에서는 별도 견적 포털을 만들기보다 주문 요청 + 관리자 메모 방식으로 시작한다.

## 12. 데이터 구조

현재 MVP는 JSON/CSV 파일 기반이다.

### Products

```text
server/data/products_combined.csv
```

상품 필드 개념:

- id
- title
- base_price 또는 price
- category
- source
- image
- availability_status
- description

### Orders

```text
server/data/orders.json
```

주요 필드:

- id
- orderNumber
- status
- paymentStatus
- customer
- customerNotes
- fulfillmentMethod
- shippingAddress
- shippingCost
- carrier
- trackingNumber
- stripeSessionId
- paymentLinkUrl
- adminNotes
- items
- totals

### Order Items

필수 snapshot 필드:

- productId
- productNameSnapshot
- unitPriceSnapshot
- quantity
- lineTotal

### Customer Prices

```text
server/data/customer_prices.json
```

개념:

- id
- customer_id
- product_id
- price
- min_quantity
- created_at
- updated_at

## 13. 회원가입 기능에서 필수로 넣어야 하는 것

B2B 이커머스에서는 일반 쇼핑몰보다 고객 식별이 중요하다.

초기 MVP에서 회원가입에 꼭 필요한 항목은 다음과 같다.

### 필수 항목

- 이름
- 이메일
- 비밀번호
- 전화번호
- 회사명
- 주소
- 도시
- 주/도
- 우편번호
- 고객 유형 기본값
- B2B 승인 여부 기본값

추천 기본값:

```text
customer_type: Lead
is_b2b_approved: false
```

### 선택 항목

- 사업자 번호
- 담당자 이름
- 배송 주소와 청구 주소 분리
- 선호 배송 방식
- 메모
- 구매 관심 품목

### 회원가입 후 흐름

1. 고객 회원가입
2. 기본 상태는 `Lead` 또는 일반 `Customer`
3. 관리자가 고객 정보 확인
4. 관리자가 B2B 승인
5. 승인 후 고객별 가격 적용 가능

### 왜 B2B 승인 여부가 필요한가

- 아무 고객에게나 도매가를 보여주면 안 됨
- 기존 거래처인지 확인 필요
- 고객별 가격을 안전하게 적용해야 함
- 대량 주문 고객을 구분해야 함

## 14. 아이디 / 비밀번호 찾기 기능

### 아이디 찾기

이 시스템에서는 이메일을 로그인 ID로 사용하는 것을 권장한다.

따라서 별도 아이디 찾기보다 다음 방식이 더 단순하다.

```text
로그인 ID = 이메일
```

필요 기능:

- 이메일을 잊은 고객은 관리자에게 문의
- 또는 전화번호 + 회사명으로 계정 확인 요청

MVP에서는 아이디 찾기를 복잡하게 만들지 않아도 된다.

### 비밀번호 찾기

비밀번호 찾기는 필수 기능이다.

권장 흐름:

1. 고객이 이메일 입력
2. 서버가 해당 이메일의 계정 존재 여부 확인
3. 비밀번호 재설정 토큰 생성
4. 이메일로 재설정 링크 발송
5. 고객이 새 비밀번호 입력
6. 기존 토큰 만료 처리

### 보안 요구사항

- 재설정 토큰은 짧은 시간만 유효해야 함
- 토큰은 DB에 hash 형태로 저장 권장
- 이메일 존재 여부를 화면에서 노출하지 않는 것이 좋음

예:

```text
If an account exists, password reset instructions will be sent.
```

### MVP 우선순위

회원 기능 Phase 1에서 꼭 필요한 것:

- 이메일 로그인
- 비밀번호 로그인
- 비밀번호 재설정 이메일
- 관리자용 고객 승인

나중에 추가해도 되는 것:

- 소셜 로그인
- 2FA
- 복잡한 권한 그룹
- 여러 사용자 담당자 계정

## 15. 필수 시스템 요소

최종적으로 필요한 핵심 요소:

- Stripe webhook
- 권한 시스템
- 이메일 알림
- 주문 상태 관리
- 결제 상태 관리
- 가격 snapshot
- B2B 승인
- 고객별 가격
- 관리자 주문 검토
- Paid invoice

## 16. MVP 개발 단계

### Phase 1: 상품 + 회원 + 주문 요청

- 상품 목록
- 상품 상세
- 장바구니
- 회원가입/로그인
- 주문 요청
- Pickup/Shipping 선택

### Phase 2: Admin + 승인 + 결제 링크

- Admin Orders
- Pending Review
- 주문 검토
- 가격 수정
- 배송비 수정
- 승인
- 결제 링크 생성

### Phase 3: B2B 가격 + 견적

- 고객별 가격
- B2B 승인 고객
- 견적 요청
- 관리자 가격 제안

### Phase 4: 인보이스 + 이메일

- 결제 완료 후 인보이스 생성
- 고객 이메일 발송
- 관리자 이메일 발송
- 결제 링크 이메일 발송

## 17. 현재 MVP 기준 다음 우선순위

현재 MVP가 이미 갖춘 것:

- 상품 목록
- 검색/필터
- 상품 상세
- 장바구니
- 주문 요청
- Pending Review
- 관리자 주문 검토
- 승인
- 결제 링크 fallback
- Stripe Checkout Session 구조
- webhook 구조
- invoice/order request view
- customer_prices 파일 기반 최소 지원

다음으로 추가하면 좋은 것:

1. 회원가입/로그인
2. 고객 관리 페이지
3. B2B 승인 기능
4. 고객별 가격 관리 UI
5. 이메일 발송
6. 실제 Stripe test mode 연결
7. 주문 상태 변경 UI 확장
8. 상품 관리 UI

## 18. 최종 원칙

이 시스템은 즉시 결제 쇼핑몰이 아니다.

항상 다음 원칙을 유지해야 한다.

- 고객은 주문 요청만 제출한다.
- 결제는 관리자 승인 후 진행한다.
- 가격은 주문 item snapshot으로 보존한다.
- 고객별 가격과 최종 관리자 가격을 분리한다.
- 배송비는 초기에는 수동 확인한다.
- 인보이스는 결제 후에만 Paid Invoice로 표시한다.
- 관리자 운영 흐름이 고객 화면보다 더 중요하다.

